using System.Diagnostics.CodeAnalysis;
using TornTools.Core.Enums;

namespace TornTools.Core.DataTransferObjects;

public class ListingDto
{
    public Guid? Id { get; set; }
    public required Guid CorrelationId { get; set; }
    public required Source Source { get; set; }
    public long? PlayerId { get; set; }
    public required int ItemId { get; set; }
    public required int ListingPosition { get; set; }
    public required DateTime TimeSeen { get; set; }
    public required long Price { get; set; }
    public required int Quantity { get; set; }

    public ListingDto() { }

    [SetsRequiredMembers]
    public ListingDto(Models.TornMarketListings.Listing listing, Guid correlationId, int itemId, int listingPosition)
    {
        Id = null;
        CorrelationId = correlationId;
        Source = Source.Torn;
        ItemId = itemId;
        ListingPosition = listingPosition;
        TimeSeen = DateTime.UtcNow;
        Price = listing.Price;
        Quantity = listing.Quantity;
    }
}
