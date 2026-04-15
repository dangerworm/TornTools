using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Cron.Enums;

namespace TornTools.Persistence.Interfaces;

public interface IQueueItemRepository
{
  Task<QueueItemDto> CreateQueueItemAsync(ApiCallType callType, string endpointUrl, CancellationToken stoppingToken);
  Task CreateQueueItemsAsync(IEnumerable<QueueItemDto> itemDtos, CancellationToken stoppingToken);
  Task<QueueItemDto?> GetNextQueueItemAsync(ApiCallType callType, CancellationToken stoppingToken);
  Task<bool> HasInProgressItemsAsync(ApiCallType callType, CancellationToken stoppingToken);
  Task<QueueItemDto> IncrementQueueItemAttemptsAsync(Guid id, CancellationToken stoppingToken);
  Task<QueueItemDto> SetQueueItemCompletedAsync(Guid id, CancellationToken stoppingToken);
  Task RemoveQueueItemsAsync(CancellationToken stoppingToken);
  Task RemoveQueueItemsAsync(ApiCallType callType, CancellationToken stoppingToken);
  Task RemoveQueueItemAsync(Guid id, CancellationToken stoppingToken);
}