using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public class YataApiCaller(
    ILogger<YataApiCaller> logger,
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory
) : ApiCaller<YataApiCaller>(logger, databaseService, httpClientFactory), IApiCaller
{
  public override IEnumerable<ApiCallType> CallTypes =>
  [
      ApiCallType.YataForeignStock
  ];

  protected override string ClientName => YataApiConstants.ClientName;

  Task<bool> IApiCaller.CallAsync(QueueItemDto queueItemDto, IApiCallHandler handler, CancellationToken stoppingToken)
  {
    return CallAsync(queueItemDto, handler, stoppingToken);
  }
}
