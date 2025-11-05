using System.Text.Json.Serialization;

namespace TornTools.Core.Models;

public class ItemsPayload
{
    [JsonPropertyName("items")]
    public List<Item> Items { get; set; } = [];
}
