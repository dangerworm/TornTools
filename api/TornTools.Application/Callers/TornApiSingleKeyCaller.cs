using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public class TornApiSingleKeyCaller(
    ILogger<TornApiSingleKeyCaller> logger,
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory
) : ApiCaller<TornApiSingleKeyCaller>(logger, databaseService, httpClientFactory), IApiCaller
{
  public override IEnumerable<ApiCallType> CallTypes =>
  [
      ApiCallType.TornKeyInfo
  ];

  protected override string ClientName => TornApiConstants.ClientName;

  Task<bool> IApiCaller.CallAsync(QueueItemDto queueItemDto, IApiCallHandler handler, CancellationToken stoppingToken)
  {
    return CallAsync(queueItemDto, handler, stoppingToken);
  }
}
