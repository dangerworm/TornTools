using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;
public interface IQueueItemRepository
{
    Task<QueueItemDto> CreateQueueItemAsync(string callHandler, string endpointUrl, CancellationToken stoppingToken);
    Task<QueueItemDto?> GetNextQueueItemAsync(CancellationToken stoppingToken);
    Task<QueueItemDto> IncrementQueueItemAttemptsAsync(Guid id, CancellationToken stoppingToken);
    Task<QueueItemDto> SetQueueItemCompletedAsync(Guid id, CancellationToken stoppingToken);
    Task RemoveCompletedQueueItemsAsync(CancellationToken stoppingToken);
}