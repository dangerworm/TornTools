using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornKey;

public class KeyPayload
{
  [JsonPropertyName("info")]
  public Info? Info { get; set; }
  [JsonPropertyName("error")]
  public Error? Error { get; set; }
}
