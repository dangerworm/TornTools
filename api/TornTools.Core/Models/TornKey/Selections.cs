using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornKey;

public class Selections
{
    [JsonPropertyName("company")]
    public string[]? Company { get; set; }
    [JsonPropertyName("faction")]
    public string[]? Faction { get; set; }
    [JsonPropertyName("market")]
    public string[]? Market { get; set; }
    [JsonPropertyName("property")]
    public string[]? Property { get; set; }
    [JsonPropertyName("torn")]
    public string[]? Torn { get; set; }
    [JsonPropertyName("user")]
    public string[]? User { get; set; }
    [JsonPropertyName("racing")]
    public string[]? Racing { get; set; }
    [JsonPropertyName("forum")]
    public string[]? Forum { get; set; }
    [JsonPropertyName("key")]
    public string[]? Key { get; set; }
}
