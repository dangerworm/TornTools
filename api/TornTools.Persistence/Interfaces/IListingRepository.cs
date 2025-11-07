using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;
public interface IListingRepository
{
    Task<ListingDto> CreateListingAsync(ListingDto listingDto, CancellationToken stoppingToken);
    Task CreateListingsAsync(IEnumerable<ListingDto> listingDtos, CancellationToken stoppingToken);
    Task<IEnumerable<ListingDto>> GetAllListingsAsync(CancellationToken stoppingToken);
    Task<IEnumerable<ListingDto>> GetListingsByItemIdAsync(int itemId, CancellationToken stoppingToken);
}