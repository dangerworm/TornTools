using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornItems;

public class ItemDetailsAmmoRateOfFire
{
    [JsonPropertyName("minimum")]
    public required int Minimum { get; set; }
    
    [JsonPropertyName("maximum")]
    public required int Maximum { get; set; }
}
