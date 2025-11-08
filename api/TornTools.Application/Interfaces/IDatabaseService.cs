using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;
public interface IDatabaseService
{
    Task UpsertItemsAsync(IEnumerable<ItemDto> items, CancellationToken stoppingToken);
    
    Task CreateListingsAsync(IEnumerable<ListingDto> listings, CancellationToken stoppingToken);
    
    Task PopulateQueue(CancellationToken stoppingToken);
    Task<QueueItemDto> CreateQueueItem(CallType callType, string endpointUrl, CancellationToken stoppingToken);
    Task<QueueItemDto?> GetNextQueueItem(CancellationToken stoppingToken);
    Task<QueueItemDto> IncrementQueueItemAttempts(Guid id, CancellationToken stoppingToken);
    Task<QueueItemDto> SetQueueItemCompleted(Guid id, CancellationToken stoppingToken);
}