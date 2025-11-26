using System.Text.Json.Serialization;
using TornTools.Core.Helpers;

namespace TornTools.Core.Models.YataStocks;

public class CountryStocks
{
    [JsonPropertyName("update")]
    [JsonConverter(typeof(UnixSecondsDateTimeConverter))]
    public required DateTime LastUpdated { get; set; }

    [JsonPropertyName("stocks")]
    public IEnumerable<ForeignStockItem> ForeignStockItems { get; set; } = [];
}

