using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornUser
{
  public class UserBasicError
  {
    [JsonPropertyName("code")]
    public int? Code { get; set; }

    [JsonPropertyName("error")]
    public string? Message { get; set; }
  }
}
