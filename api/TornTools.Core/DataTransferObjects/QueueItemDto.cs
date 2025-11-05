using System.ComponentModel.DataAnnotations;
using TornTools.Cron.Enums;

namespace TornTools.Core.DataTransferObjects;
public class QueueItemDto
{
    public Guid? Id { get; set; }
    
    public required string CallType { get; set; }
    public required string EndpointUrl { get; set; } = default!;

    public string? HttpMethod { get; set; } = "GET";
    public Dictionary<string, string>? HeadersJson { get; set; } // Optional custom headers
    public Dictionary<string, string>? PayloadJson { get; set; } // Optional POST/PUT body

    public string ItemStatus { get; set; } = nameof(QueueStatus.Pending);

    public int Attempts { get; set; } = 0;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastAttemptAt { get; set; }
    public DateTimeOffset? NextAttemptAt { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
}
