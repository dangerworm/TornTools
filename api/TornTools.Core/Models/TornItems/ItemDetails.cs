using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornItems;

public class ItemDetails
{
    [JsonPropertyName("category")]
    public string? Category { get; set; }
    
    [JsonPropertyName("stealth_level")]
    public decimal? StealthLevel { get; set; }

    [JsonPropertyName("base_stats")]
    public required ItemDetailsBaseStats BaseStats { get; set; }

    [JsonPropertyName("ammo")]
    public ItemDetailsAmmo? Ammo { get; set; }

    [JsonPropertyName("mods")]
    public IEnumerable<int>? Mods { get; set; }

    [JsonPropertyName("coverage")]
    public IEnumerable<ItemDetailsCoverage>? Coverage { get; set; }
}
