using System.Text.Json.Serialization;

namespace TornTools.Core.Models;
public class ItemValueVendor
{
    [JsonPropertyName("country")]
    public required string Country { get; set; }
    
    [JsonPropertyName("name")]
    public required string Name { get; set; }
}
