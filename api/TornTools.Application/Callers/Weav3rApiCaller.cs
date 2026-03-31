using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Reflection;
using System.Text.Json;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public class Weav3rApiCaller(
    ILogger<Weav3rApiCaller> logger,
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory
) : ApiCaller<Weav3rApiCaller>(logger, databaseService, httpClientFactory), IApiCaller
{
  public override IEnumerable<ApiCallType> CallTypes =>
  [
      ApiCallType.Weav3rBazaarListings
  ];

  protected override string ClientName => Weav3rApiConstants.ClientName;

  protected override async Task<string?> Fetch(
    HttpClient client,
    HttpRequestMessage requestMessage,
    CancellationToken stoppingToken)
  {
    if (requestMessage.RequestUri is null)
    {
      return null;
    }

    var headers = requestMessage.Headers
      .ToDictionary(h => h.Key, h => h.Value.First());

    var psi = new ProcessStartInfo
    {
      FileName = "python",
      EnvironmentVariables =
      {
        ["FETCH_HEADERS"] = JsonSerializer.Serialize(headers),
        ["PYTHONUNBUFFERED"] = "1", // Ensure real-time output
      },
      RedirectStandardOutput = true,
      RedirectStandardError = true,
      UseShellExecute = false,
      CreateNoWindow = true
    };

    var location = Assembly.GetExecutingAssembly().Location ?? string.Empty;
    var pythonScript = Path.Combine(
          Path.GetDirectoryName(location) ?? string.Empty,
          "Weav3rPython",
          "bazaar_fetch.py");
    var url = requestMessage.RequestUri.ToString();

    psi.ArgumentList.Add(pythonScript);
    psi.ArgumentList.Add(url);

    using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken, timeoutCts.Token);

    using var process = new Process { StartInfo = psi };
    process.Start();

    try
    {
      var contentTask = process.StandardOutput.ReadToEndAsync(linkedCts.Token);
      var errorTask = process.StandardError.ReadToEndAsync(linkedCts.Token);
      await process.WaitForExitAsync(linkedCts.Token);

      var content = await contentTask;
      var error = await errorTask;

      if (process.ExitCode != 0)
      {
        Logger.LogError("bazaar_fetch.py failed: {Error}", error);
        return null;
      }

      return content;
    }
    catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested)
    {
      process.Kill(entireProcessTree: true);
      Logger.LogError("bazaar_fetch.py timed out after 30 seconds.");
      return null;
    }
  }

  Task<bool> IApiCaller.CallAsync(QueueItemDto item, IApiCallHandler handler, CancellationToken ct)
  {
    return CallAsync(item, handler, ct);
  }
}
