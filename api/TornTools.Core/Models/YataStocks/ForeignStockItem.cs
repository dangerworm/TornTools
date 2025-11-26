using System.Text.Json.Serialization;

namespace TornTools.Core.Models.YataStocks;

public class ForeignStockItem
{
    [JsonPropertyName("id")]
    public required int ItemId { get; set; }

    [JsonPropertyName("name")]
    public required string ItemName { get; set; }

    [JsonPropertyName("quantity")]
    public required int Quantity { get; set; }
    
    [JsonPropertyName("cost")]
    public required long Cost { get; set; }
}
