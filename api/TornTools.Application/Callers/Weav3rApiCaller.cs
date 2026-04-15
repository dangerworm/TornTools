using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Application.Services;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public class Weav3rApiCaller(
    ILogger<Weav3rApiCaller> logger,
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory,
    Weav3rPythonServer server
) : ApiCaller<Weav3rApiCaller>(logger, databaseService, httpClientFactory), IApiCaller
{
  private readonly Weav3rPythonServer _server = server;

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
    if (requestMessage.RequestUri is null) return null;

    var headers = requestMessage.Headers
        .ToDictionary(h => h.Key, h => h.Value.First());

    return await _server.FetchAsync(requestMessage.RequestUri.ToString(), headers, stoppingToken);
  }

  Task<bool> IApiCaller.CallAsync(QueueItemDto item, IApiCallHandler handler, CancellationToken ct)
  {
    return CallAsync(item, handler, ct);
  }
}
