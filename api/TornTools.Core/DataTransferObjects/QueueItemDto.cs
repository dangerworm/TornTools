using TornTools.Core.Enums;
using TornTools.Cron.Enums;

namespace TornTools.Core.DataTransferObjects;

public class QueueItemDto
{
    public Guid? Id { get; set; }
    
    public required CallType CallType { get; set; }
    public required string EndpointUrl { get; set; } = default!;

    public string? HttpMethod { get; set; } = "GET";
    public Dictionary<string, string>? HeadersJson { get; set; } // Optional custom headers
    public Dictionary<string, string>? PayloadJson { get; set; } // Optional POST/PUT body

    public string ItemStatus { get; set; } = nameof(QueueStatus.Pending);

    public int Attempts { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastAttemptAt { get; set; }
    public DateTime? NextAttemptAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
