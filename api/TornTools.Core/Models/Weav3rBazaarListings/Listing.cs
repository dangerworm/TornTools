using System.Text.Json.Serialization;

namespace TornTools.Core.Models.Weav3rBazaarListings;

public class Listing
{
    [JsonPropertyName("item_id")]
    public required int ItemId { get; set; }

    [JsonPropertyName("player_id")]
    public required int PlayerId { get; set; }

    [JsonPropertyName("player_name")]
    public required string PlayerName { get; set; }

    [JsonPropertyName("quantity")]
    public required int Quantity { get; set; }

    [JsonPropertyName("price")]
    public required int Price { get; set; }

    [JsonPropertyName("content_updated")]
    public required long ContentUpdated { get; set; }

    [JsonPropertyName("last_checked")]
    public required long LastChecked { get; set; }

    [JsonPropertyName("content_updated_relative")]
    public required string ContentUpdatedRelative { get; set; }
    
    [JsonPropertyName("last_checked_relative")]
    public required string LastCheckedRelative { get; set; }
}
