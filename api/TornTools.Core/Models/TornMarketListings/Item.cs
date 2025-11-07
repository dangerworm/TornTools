using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornMarketListings;

public class Item
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public required string Name { get; set; }

    [JsonPropertyName("type")]
    public required string Type { get; set; }

    [JsonPropertyName("average_price")]
    public required long AveragePrice { get; set; }
}
