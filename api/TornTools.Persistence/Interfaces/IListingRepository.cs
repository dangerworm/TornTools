using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Persistence.Interfaces;
public interface IListingRepository
{
    Task<ListingDto> CreateListingAsync(ListingDto listingDto, CancellationToken stoppingToken);
    Task CreateListingsAsync(IEnumerable<ListingDto> listingDtos, CancellationToken stoppingToken);
    Task<IEnumerable<ListingDto>> GetAllListingsAsync(CancellationToken stoppingToken);
    Task<IEnumerable<ListingDto>> GetListingsByItemIdAsync(int itemId, CancellationToken stoppingToken);
    Task<IEnumerable<ListingDto>> GetListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken);
    Task DeleteListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken);
}