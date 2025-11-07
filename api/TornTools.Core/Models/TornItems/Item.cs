using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornItems;

public class Item
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public required string Name { get; set; }

    [JsonPropertyName("description")]
    public required string Description { get; set; }

    [JsonPropertyName("effect")]
    public string? Effect { get; set; }

    [JsonPropertyName("requirement")]
    public string? Requirement { get; set; }

    [JsonPropertyName("image")]
    public required string Image { get; set; }

    [JsonPropertyName("type")]
    public required string Type { get; set; }

    [JsonPropertyName("sub_type")]
    public string? SubType { get; set; }

    [JsonPropertyName("is_masked")]
    public required bool IsMasked { get; set; }

    [JsonPropertyName("is_tradable")]
    public required bool IsTradable { get; set; }

    [JsonPropertyName("is_found_in_city")]
    public required bool IsFoundInCity { get; set; }

    [JsonPropertyName("value")]
    public required ItemValue Value { get; set; }

    [JsonPropertyName("circulation")]
    public required int Circulation { get; set; }

    [JsonPropertyName("details")]
    public ItemDetails? Details { get; set; }
}
