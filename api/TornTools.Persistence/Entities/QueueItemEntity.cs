using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;
using TornTools.Cron.Enums;

namespace TornTools.Persistence.Entities;

[Table("queue_items", Schema = "public")]
public class QueueItemEntity
{
    [Key]
    [Column("id")]
    public Guid? Id { get; set; }

    [Required]
    [Column("call_handler")]
    public required string CallHandler { get; set; }

    [Required]
    [Column("endpoint_url")]
    public required string EndpointUrl { get; set; }

    [Required]
    [Column("http_method")]
    public required string HttpMethod { get; set; } = "GET";
    
    [Column("headers_json", TypeName = "jsonb")]
    public Dictionary<string, string>? HeadersJson { get; set; } // Optional custom headers
    
    [Column("payload_json", TypeName = "jsonb")]
    public Dictionary<string, string>? PayloadJson { get; set; } // Optional POST/PUT body

    [Required]
    [Column("item_status")]
    public required string ItemStatus { get; set; } = nameof(QueueStatus.Pending);

    [Required]
    [Column("attempts")]
    public int Attempts { get; set; } = 0;

    [Required]
    [Column("created_at")]
    public required DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("last_attempt_at")]
    public DateTime? LastAttemptAt { get; set; }

    [Column("next_attempt_at")]
    public DateTime? NextAttemptAt { get; set; }

    [Column("processed_at")]
    public DateTime? ProcessedAt { get; set; }

    public QueueItemDto AsDto()
    {
        return new QueueItemDto
        {
            Id = Id,
            CallHandler = CallHandler,
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
