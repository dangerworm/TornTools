using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornUser;

public class UserBasicPayload
{
  [JsonPropertyName("basic")]
  public UserBasic? Basic { get; set; }

  [JsonPropertyName("error")]
  public UserBasicError? Error { get; set; }
}

public class UserBasic
{
  [JsonPropertyName("name")]
  public string? Name { get; set; }

  [JsonPropertyName("level")]
  public int? Level { get; set; }

  [JsonPropertyName("gender")]
  public string? Gender { get; set; }
}

public class UserBasicError
{
  [JsonPropertyName("code")]
  public int? Code { get; set; }

  [JsonPropertyName("error")]
  public string? Message { get; set; }
}
