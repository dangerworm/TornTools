using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornMarketListings;

public class Error
{
  [JsonPropertyName("code")]
  public int Code { get; set; }
  [JsonPropertyName("error")]
  public string? ErrorMessage { get; set; }
}
