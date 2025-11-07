using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornMarketListings;

public class ItemMarket
{
    [JsonPropertyName("item")]
    public required Item Item { get; set; }
    
    [JsonPropertyName("listings")]
    public required IEnumerable<Listing> Listings { get; set; }
}
