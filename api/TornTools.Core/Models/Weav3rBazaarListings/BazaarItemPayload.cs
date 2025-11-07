using System.Text.Json.Serialization;

namespace TornTools.Core.Models.Weav3rBazaarListings;

public class BazaarItemPayload
{
    [JsonPropertyName("item_id")]
    public required int ItemId { get; set; }

    [JsonPropertyName("item_name")]
    public required string ItemName { get; set; }

    [JsonPropertyName("market_price")]
    public required long MarketPrice { get; set; }

    [JsonPropertyName("bazaar_average")]
    public required long BazaarAverage { get; set; }

    [JsonPropertyName("total_listings")]
    public required int TotalListings { get; set; }

    [JsonPropertyName("listings")]
    public IEnumerable<Listing> Listings { get; set; } = [];
}
