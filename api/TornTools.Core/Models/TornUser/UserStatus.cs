using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornUser
{
  public class UserStatus
  {
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("details")]
    public string? Details { get; set; }

    [JsonPropertyName("state")]
    public string? State { get; set; }

    [JsonPropertyName("color")]
    public string? Color { get; set; }
  }
}
