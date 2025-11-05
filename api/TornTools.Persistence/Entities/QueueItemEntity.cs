using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;
using TornTools.Cron.Enums;

namespace TornTools.Persistence.Entities;

[Table("queue_items", Schema = "public")]
public class QueueItemEntity
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("call_type")]
    [Required]
    public required string CallType { get; set; }

    [Column("endpoint_url")]
    [Required]
    public required string EndpointUrl { get; set; }

    [Column("http_method")]
    public string? HttpMethod { get; set; } = "GET";
    
    [Column("headers_json", TypeName = "jsonb")]
    public Dictionary<string, string>? HeadersJson { get; set; } // Optional custom headers
    
    [Column("payload_json", TypeName = "jsonb")]
    public Dictionary<string, string>? PayloadJson { get; set; } // Optional POST/PUT body

    [Column("item_status")]
    public required string ItemStatus { get; set; } = nameof(QueueStatus.Pending);

    [Column("attempts")]
    public int Attempts { get; set; } = 0;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [Column("last_attempt_at")]
    public DateTimeOffset? LastAttemptAt { get; set; }

    [Column("next_attempt_at")]
    public DateTimeOffset? NextAttemptAt { get; set; }

    [Column("processed_at")]
    public DateTimeOffset? ProcessedAt { get; set; }

    public QueueItemDto AsDto()
    {
        return new QueueItemDto
        {
            Id = Id,
            CallType = CallType,
            EndpointUrl = EndpointUrl,
            HttpMethod = HttpMethod,
            HeadersJson = HeadersJson,
            PayloadJson = PayloadJson,
            ItemStatus = ItemStatus,
            Attempts = Attempts,
            CreatedAt = CreatedAt,
            LastAttemptAt = LastAttemptAt,
            NextAttemptAt = NextAttemptAt,
            ProcessedAt = ProcessedAt
        };
    }
}
