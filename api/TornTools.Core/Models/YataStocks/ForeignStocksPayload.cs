using System.Text.Json.Serialization;
using TornTools.Core.Helpers;

namespace TornTools.Core.Models.YataStocks;

public class ForeignStocksPayload
{
    [JsonPropertyName("stocks")]
    public required Dictionary<string, CountryStocks> CountryStocks { get; set; }

    [JsonPropertyName("timestamp")]
    [JsonConverter(typeof(UnixSecondsDateTimeConverter))]
    public required DateTime Timestamp { get; set; }
}

