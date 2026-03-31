using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornUser
{
  public class UserProfile
  {
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("level")]
    public int? Level { get; set; }

    [JsonPropertyName("gender")]
    public string? Gender { get; set; }

    [JsonPropertyName("status")]
    public UserStatus? Status { get; set; }
  }
}
