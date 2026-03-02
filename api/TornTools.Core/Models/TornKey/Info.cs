using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornKey;

public class Info
{
    [JsonPropertyName("selections")]
    public Selections? Selections { get; set; }
    [JsonPropertyName("access")]
    public Access? Access { get; set; }
    [JsonPropertyName("user")]
    public User? User { get; set; }
}
