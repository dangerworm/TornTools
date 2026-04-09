using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornMarketListings;

public class ItemMarketPayload
{
  [JsonPropertyName("itemmarket")]
  public ItemMarket? ItemMarket { get; set; }

  [JsonPropertyName("error")]
  public Error? Error { get; set; }
}
