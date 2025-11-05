using TornTools.Core.DataTransferObjects;

namespace TornTools.Application.Interfaces;
public interface IDatabaseService
{
    Task<QueueItemDto> CreateQueueItem(string endpointUrl, CancellationToken stoppingToken);
    Task<QueueItemDto?> GetNextQueueItem(CancellationToken stoppingToken);
    Task<QueueItemDto> IncrementQueueItemAttempts(Guid id);
    Task<QueueItemDto> SetQueueItemCompleted(Guid id);
}