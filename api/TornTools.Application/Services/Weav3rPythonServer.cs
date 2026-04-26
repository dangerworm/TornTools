using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TornTools.Application.Services;

/// <summary>
/// Singleton that manages a persistent bazaar_server process for Weav3r API calls.
/// Keeping the process alive eliminates per-call Python startup overhead (~1-2s on production).
/// Concurrent callers are serialised via a SemaphoreSlim - one request at a time per process.
/// </summary>
public sealed class Weav3rPythonServer : IDisposable
{
  // Default pause when upstream returns 429 with no Retry-After header.
  private static readonly TimeSpan DefaultCooldown = TimeSpan.FromSeconds(30);
  // Sanity cap so a malformed or hostile Retry-After can't park us indefinitely.
  private static readonly TimeSpan MaxCooldown = TimeSpan.FromMinutes(5);
  // 403s rarely self-resolve (fingerprint / WAF / IP) — back off harder than 429.
  private static readonly TimeSpan ForbiddenCooldown = TimeSpan.FromMinutes(5);
  // Circuit-breaker: after this many 403s in a row, assume we're being blocked
  // wholesale and stop retrying until human intervention.
  private const int ConsecutiveForbiddenThreshold = 20;
  private static readonly TimeSpan CircuitBreakerCooldown = TimeSpan.FromHours(1);
  // Truncate body snippets in error logs so a Cloudflare HTML page doesn't dominate the logs.
  private const int BodySnippetLogLimit = 500;

  private readonly ILogger<Weav3rPythonServer> _logger;
  private readonly string _compiledPath;
  private readonly string _scriptPath;
  private readonly string _pythonExe;
  private Process? _process;
  private readonly SemaphoreSlim _requestLock = new(1, 1);
  private DateTime _cooldownUntilUtc = DateTime.MinValue;
  private int _consecutiveForbidden;

  public Weav3rPythonServer(ILogger<Weav3rPythonServer> logger)
  {
    _logger = logger;
    var baseDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location) ?? string.Empty;
    _compiledPath = Path.Combine(baseDir, "Weav3rPython", "bazaar_server");
    _scriptPath = Path.Combine(baseDir, "Weav3rPython", "bazaar_server.py");
    _pythonExe = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "python" : "python3";
  }

  public async Task<string?> FetchAsync(string url, Dictionary<string, string>? headers, CancellationToken ct)
  {
    await _requestLock.WaitAsync(ct);
    try
    {
      var remaining = _cooldownUntilUtc - DateTime.UtcNow;
      if (remaining > TimeSpan.Zero)
      {
        _logger.LogInformation(
            "bazaar_server in cooldown; waiting {Seconds:F1}s before next request.",
            remaining.TotalSeconds);
        await Task.Delay(remaining, ct);
      }

      EnsureProcessRunning();

      var requestLine = JsonSerializer.Serialize(new RequestPayload(url, headers ?? []));
      _process!.StandardInput.NewLine = "\n";
      await _process!.StandardInput.WriteLineAsync(requestLine.AsMemory(), ct);
      await _process!.StandardInput.FlushAsync(ct);

      using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
      timeoutCts.CancelAfter(TimeSpan.FromSeconds(30));

      var responseLine = await _process!.StandardOutput.ReadLineAsync(timeoutCts.Token);
      if (responseLine is null)
      {
        _logger.LogError("bazaar_server closed stdout unexpectedly; will restart on next call.");
        KillProcess();
        return null;
      }

      var response = JsonSerializer.Deserialize<ResponsePayload>(responseLine);
      if (response?.Ok == true)
      {
        _consecutiveForbidden = 0;
        return response.Body;
      }

      if (response?.Status == 429)
      {
        _consecutiveForbidden = 0;
        var cooldown = DefaultCooldown;
        if (response.RetryAfterSeconds is double seconds && double.IsFinite(seconds) && seconds > 0)
        {
          var capped = Math.Min(seconds, MaxCooldown.TotalSeconds);
          cooldown = TimeSpan.FromSeconds(capped);
        }

        _cooldownUntilUtc = DateTime.UtcNow + cooldown;
        _logger.LogWarning(
            "bazaar_server got HTTP 429; pausing all Weav3r calls for {Seconds:F1}s (Retry-After: {RetryAfter}). Body: {Body}",
            cooldown.TotalSeconds,
            response.RetryAfterSeconds?.ToString("F1") ?? "absent",
            TruncateForLog(response.Body));
      }
      else if (response?.Status == 403)
      {
        _consecutiveForbidden++;
        var tripped = _consecutiveForbidden >= ConsecutiveForbiddenThreshold;
        var cooldown = tripped ? CircuitBreakerCooldown : ForbiddenCooldown;
        _cooldownUntilUtc = DateTime.UtcNow + cooldown;

        if (tripped)
        {
          _logger.LogCritical(
              "bazaar_server: {Count} consecutive 403s — circuit breaker tripped, pausing Weav3r for {Minutes:F0} min. Body: {Body}",
              _consecutiveForbidden,
              cooldown.TotalMinutes,
              TruncateForLog(response.Body));
        }
        else
        {
          _logger.LogWarning(
              "bazaar_server got HTTP 403 ({Count}/{Threshold}); pausing all Weav3r calls for {Seconds:F0}s. Body: {Body}",
              _consecutiveForbidden,
              ConsecutiveForbiddenThreshold,
              cooldown.TotalSeconds,
              TruncateForLog(response.Body));
        }
      }
      else
      {
        _consecutiveForbidden = 0;
        _logger.LogError(
            "bazaar_server returned error: {Error}. Body: {Body}",
            response?.Error,
            TruncateForLog(response?.Body));
      }
      return null;
    }
    catch (OperationCanceledException) when (!ct.IsCancellationRequested)
    {
      _logger.LogError("bazaar_server timed out after 30 s; killing process.");
      KillProcess();
      return null;
    }
    finally
    {
      _requestLock.Release();
    }
  }

  private void EnsureProcessRunning()
  {
    if (_process is { HasExited: false }) return;
    KillProcess();
    StartProcess();
  }

  private void StartProcess()
  {
    bool useCompiled = File.Exists(_compiledPath);

    var psi = new ProcessStartInfo
    {
      FileName = useCompiled ? _compiledPath : _pythonExe,
      RedirectStandardInput = true,
      RedirectStandardOutput = true,
      RedirectStandardError = true,
      UseShellExecute = false,
      CreateNoWindow = true,
    };

    psi.EnvironmentVariables["PYTHONUNBUFFERED"] = "1";

    if (!useCompiled)
      psi.ArgumentList.Add(_scriptPath);

    _process = new Process { StartInfo = psi };
    _process.ErrorDataReceived += (_, e) =>
    {
      if (e.Data is not null)
        _logger.LogError("bazaar_server stderr: {Error}", e.Data);
    };
    _process.Start();
    _process.BeginErrorReadLine();

    _logger.LogInformation("bazaar_server started (PID {Pid}, {Mode}).",
        _process.Id, useCompiled ? "compiled binary" : "Python script");
  }

  private void KillProcess()
  {
    if (_process is null) return;
    try { _process.Kill(entireProcessTree: true); } catch { /* best effort */ }
    _process.Dispose();
    _process = null;
  }

  public void Dispose()
  {
    KillProcess();
    _requestLock.Dispose();
  }

  private static string TruncateForLog(string? body)
  {
    if (string.IsNullOrEmpty(body)) return "<empty>";
    var trimmed = body.Length > BodySnippetLogLimit ? body[..BodySnippetLogLimit] : body;
    return trimmed.Replace('\n', ' ').Replace('\r', ' ');
  }

  private record RequestPayload(
      [property: JsonPropertyName("url")] string Url,
      [property: JsonPropertyName("headers")] Dictionary<string, string> Headers
  );

  private record ResponsePayload(
      [property: JsonPropertyName("ok")] bool Ok,
      [property: JsonPropertyName("body")] string? Body,
      [property: JsonPropertyName("error")] string? Error,
      [property: JsonPropertyName("status")] int? Status,
      [property: JsonPropertyName("retry_after_seconds")] double? RetryAfterSeconds
  );
}
