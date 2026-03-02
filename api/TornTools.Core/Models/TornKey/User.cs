using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornKey;

public class User
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }

    [JsonPropertyName("faction_id")]
    public int? FactionId { get; set; }

    [JsonPropertyName("company_id")]
    public int? CompanyId { get; set; }
}
