using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornItems;

public class ItemDetailsCoverage
{
    [JsonPropertyName("name")]
    public required string Name { get; set; }
    
    [JsonPropertyName("value")]
    public required float Value { get; set; }
}
