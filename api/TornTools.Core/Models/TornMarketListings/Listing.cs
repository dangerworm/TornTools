using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornMarketListings;

public class Listing
{
    [JsonPropertyName("price")]
    public long Price { get; set; }

    [JsonPropertyName("amount")]
    public int Quantity { get; set; }
}
