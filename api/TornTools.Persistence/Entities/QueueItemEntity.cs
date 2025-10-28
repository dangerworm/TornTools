using System.ComponentModel.DataAnnotations;
using TornTools.Cron.Enums;

namespace TornTools.Persistence.Entities;
public class QueueItemEntity
{
    public Guid Id { get; set; }

    [Required]
    public string EndpointUrl { get; set; } = default!;

    public string? HttpMethod { get; set; } = "GET";
    public string? HeadersJson { get; set; } // Optional custom headers
    public string? PayloadJson { get; set; } // Optional POST/PUT body

    public QueueStatus Status { get; set; } = QueueStatus.Pending;

    public int Attempts { get; set; } = 0;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastAttemptAt { get; set; }
    public DateTimeOffset? NextAttemptAt { get; set; }
}
