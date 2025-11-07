using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornItems;

public class ItemDetailsBaseStats
{
    [JsonPropertyName("damage")]
    public int Damage { get; set; }

    [JsonPropertyName("accuracy")]
    public int Accuracy { get; set; }

    [JsonPropertyName("armor")]
    public int Armor { get; set; }
}
