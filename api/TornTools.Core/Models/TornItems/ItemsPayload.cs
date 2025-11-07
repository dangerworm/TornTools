using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornItems;

public class ItemsPayload
{
    [JsonPropertyName("items")]
    public IEnumerable<Item> Items { get; set; } = [];
}
