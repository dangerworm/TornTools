using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornItems;

public class ItemDetailsAmmo
{
    [JsonPropertyName("id")]
    public required int Id { get; set; }

    [JsonPropertyName("name")]
    public required string Name { get; set; }

    [JsonPropertyName("magazine_rounds")]
    public required int MagazineRounds { get; set; }

    [JsonPropertyName("rate_of_fire")]
    public required ItemDetailsAmmoRateOfFire RateOfFire { get; set; }
}
