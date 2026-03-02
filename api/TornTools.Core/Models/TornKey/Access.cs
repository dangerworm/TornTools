using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornKey;

public class Access
{
    [JsonPropertyName("level")]
    public int? Level { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("faction")]
    public bool? Faction { get; set; }

    [JsonPropertyName("company")]
    public bool? Company { get; set; }

    [JsonPropertyName("log")]
    public Log? Log { get; set; }
}
