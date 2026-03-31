using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;

public interface IApiCallHandler
{
  ApiCallType CallType { get; }
  Task HandleResponseAsync(QueueItemDto item, string content, CancellationToken stoppingToken);
}