using System.Text.Json.Serialization;

namespace TornTools.Core.Models;

public class ItemValue
{
    [JsonPropertyName("vendor")]
    public ItemValueVendor? Vendor { get; set; }

    [JsonPropertyName("buy_price")]
    public long? BuyPrice { get; set; }

    [JsonPropertyName("sell_price")]
    public int? SellPrice { get; set; }

    [JsonPropertyName("market_price")]
    public required long MarketPrice { get; set; }
}