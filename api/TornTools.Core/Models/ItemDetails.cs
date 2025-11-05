using System.Text.Json.Serialization;

namespace TornTools.Core.Models;

public class ItemDetails
{
    [JsonPropertyName("category")]
    public required string Category { get; set; }
    
    [JsonPropertyName("stealth_level")]
    public float StealthLevel { get; set; }

    [JsonPropertyName("base_stats")]
    public required ItemDetailsBaseStats BaseStats { get; set; }

    [JsonPropertyName("ammo")]
    public required ItemDetailsAmmo? Ammo { get; set; }

    [JsonPropertyName("mods")]
    public List<int> Mods { get; set; } = [];

    [JsonPropertyName("coverage")]
    public required List<ItemDetailsCoverage> Coverage { get; set; }
}
