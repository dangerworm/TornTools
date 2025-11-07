using System.Diagnostics.CodeAnalysis;

namespace TornTools.Core.DataTransferObjects;

public class ListingDto
{
    public Guid? Id { get; set; }
    public required Guid CorrelationId { get; set; }
    public required string Source { get; set; }
    public long? PlayerId { get; set; }
    public required int ItemId { get; set; }
    public required int ListingPosition { get; set; }
    public required DateTimeOffset TimeSeen { get; set; }
    public required long Price { get; set; }
    public required int Quantity { get; set; }

    public ListingDto() { }

    [SetsRequiredMembers]
    public ListingDto(Models.TornMarketListings.Listing listing, Guid correlationId, int itemId, int listingPosition)
    {
        Id = null;
        CorrelationId = correlationId;
        Source = "Torn";
        ItemId = itemId;
        ListingPosition = listingPosition;
        TimeSeen = DateTimeOffset.UtcNow;
        Price = listing.Price;
        Quantity = listing.Amount;
    }

    [SetsRequiredMembers]
    public ListingDto(Models.Weav3rBazaarListings.Listing listing, Guid correlationId, int listingPosition) 
    {
        Id = null;
        CorrelationId = correlationId;
        Source = "Weav3r";
        PlayerId = listing.PlayerId;
        ItemId = listing.ItemId;
        ListingPosition = listingPosition;
        TimeSeen = DateTimeOffset.FromUnixTimeSeconds(listing.ContentUpdated);
        Price = listing.Price;
        Quantity = listing.Quantity;
    }
}
