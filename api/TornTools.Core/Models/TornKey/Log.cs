using System.Text.Json.Serialization;

namespace TornTools.Core.Models.TornKey;

public class Log
{
    [JsonPropertyName("custom_permissions")]
    public bool? CustomPermissions { get; set; }

    [JsonPropertyName("available")]
    public object[]? Available { get; set; }
}
