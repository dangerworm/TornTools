using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;
public interface IDatabaseService
{
    Task CreateItemChangeLogAsync(ItemChangeLogDto changeLogDto, CancellationToken stoppingToken);

    Task UpsertItemsAsync(IEnumerable<ItemDto> items, CancellationToken stoppingToken);
    
    Task CreateListingsAsync(IEnumerable<ListingDto> listings, CancellationToken stoppingToken);
    Task<IEnumerable<ListingDto>> GetListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken);
    Task DeleteListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken);

    Task PopulateQueue(CancellationToken stoppingToken);
    Task<QueueItemDto> CreateQueueItem(CallType callType, string endpointUrl, CancellationToken stoppingToken);
    Task<QueueItemDto?> GetNextQueueItem(CancellationToken stoppingToken);
    Task<QueueItemDto> IncrementQueueItemAttempts(Guid id, CancellationToken stoppingToken);
    Task<QueueItemDto> SetQueueItemCompleted(Guid id, CancellationToken stoppingToken);
}