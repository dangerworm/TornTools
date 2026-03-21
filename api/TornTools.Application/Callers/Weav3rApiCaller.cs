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
    var location = Assembly.GetExecutingAssembly().Location ?? string.Empty;
    var pythonScript = Path.Combine(
          Path.GetDirectoryName(location) ?? string.Empty,
          "Weav3rPython",
          "bazaar_fetch.py");
    var url = requestMessage.RequestUri.ToString();

    var psi = new ProcessStartInfo
    {
      FileName = "python",
      EnvironmentVariables =
      {
        ["FETCH_HEADERS"] = JsonSerializer.Serialize(headers),
        ["PYTHONUNBUFFERED"] = "1", // Ensure real-time output
      },
      Arguments = $"{pythonScript} \"{url}\"",
      RedirectStandardOutput = true,
      RedirectStandardError = true,
      UseShellExecute = false,
      CreateNoWindow = true
    };

    using var process = new Process { StartInfo = psi };
    process.Start();

    var content = await process.StandardOutput.ReadToEndAsync(stoppingToken);
    var error = await process.StandardError.ReadToEndAsync(stoppingToken);

    await process.WaitForExitAsync(stoppingToken);

    if (process.ExitCode != 0)
    {
      Logger.LogError("bazaar_fetch.py failed: {Error}", error);
      return null;
    }

    return content;
  }

  Task<bool> IApiCaller.CallAsync(QueueItemDto item, IApiCallHandler handler, CancellationToken ct)
  {
    return CallAsync(item, handler, ct);
  }
}
