using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text.Json;
using TornTools.Application.Interfaces;
using TornTools.Core.Configurations;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public class Weav3rApiCaller(
    ILogger<Weav3rApiCaller> logger,
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory,
    Weav3rApiCallerConfiguration options
) : ApiCaller<Weav3rApiCaller>(logger, databaseService, httpClientFactory), IApiCaller
{
  private readonly Weav3rApiCallerConfiguration _options = options ?? throw new ArgumentNullException(nameof(options));

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
    var pythonScript = "/api/TornTools.Application/Weav3rPython/bazaar_fetch.py";
    var url = requestMessage.RequestUri.ToString();

    var psi = new ProcessStartInfo
    {
      FileName = "python3",
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
