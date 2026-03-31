using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornUser;

public class UserBasicPayload
{
  [JsonPropertyName("profile")]
  public UserProfile? Profile { get; set; }

  [JsonPropertyName("error")]
  public UserBasicError? Error { get; set; }
}
