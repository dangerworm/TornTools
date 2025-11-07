using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornMarketListings;

public class ItemMarketPayload
{
    [JsonPropertyName("itemmarket")]
    public required ItemMarket ItemMarket { get; set; }
}
