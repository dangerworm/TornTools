using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornItems;
public class ItemValueVendor
{
    [JsonPropertyName("country")]
    public required string Country { get; set; }
    
    [JsonPropertyName("name")]
    public required string Name { get; set; }
}
