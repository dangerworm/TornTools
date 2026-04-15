using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Text.Json;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Cron.Enums;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;

public class QueueItemRepository(
    ILogger<QueueItemRepository> logger,
    TornToolsDbContext dbContext
) : RepositoryBase<QueueItemRepository>(logger, dbContext), IQueueItemRepository
{
  public async Task<QueueItemDto> CreateQueueItemAsync(ApiCallType callType, string endpointUrl, CancellationToken stoppingToken)
  {
    var queueItem = new QueueItemEntity
    {
      CallType = callType.ToString(),
      EndpointUrl = endpointUrl,
      HttpMethod = "GET",
      ItemStatus = nameof(QueueStatus.Pending),
      CreatedAt = DateTime.UtcNow
    };

    DbContext.QueueItems.Add(queueItem);
    await DbContext.SaveChangesAsync(stoppingToken);
    return queueItem.AsDto();
  }

  public async Task CreateQueueItemsAsync(IEnumerable<QueueItemDto> itemDtos, CancellationToken stoppingToken)
  {
    var items = itemDtos.ToList();

    // Assign interleaved QueueIndex: withinGroupIndex * typeCount + (int)callType.
    // This ensures TML and WBL (and any future call types) alternate in the dequeue
    // order without any change to this method when new ApiCallType values are added.
    var typeCount = Enum.GetValues<ApiCallType>().Length;
    var groupCounters = new Dictionary<ApiCallType, int>();
    foreach (var item in items)
    {
      if (!groupCounters.TryGetValue(item.CallType, out var groupIndex)) groupIndex = 0;
      item.QueueIndex = (long)groupIndex * typeCount + (int)item.CallType;
      groupCounters[item.CallType] = groupIndex + 1;
    }

    for (int i = 0; i < items.Count; i += DatabaseConstants.BulkUpdateSize)
    {
      var batch = items.Skip(i).Take(DatabaseConstants.BulkUpdateSize).ToList();

      foreach (var itemDto in batch)
      {
        DbContext.QueueItems.Add(CreateEntityFromDto(itemDto));
      }

      await DbContext.SaveChangesAsync(stoppingToken);
      DbContext.ChangeTracker.Clear();
    }
  }

  // Atomically claims the next eligible queue item using SELECT FOR UPDATE SKIP LOCKED.
  // This is safe for concurrent workers: each worker locks and updates a different row,
  // and SKIP LOCKED means workers never block each other waiting for the same row.
  private const string ClaimNextItemSql = """
    UPDATE public.queue_items
    SET item_status = 'InProgress'
    WHERE id = (
        SELECT id
        FROM public.queue_items
        WHERE item_status = 'Pending'
          AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
        ORDER BY queue_index
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    RETURNING
        id, call_type, endpoint_url, http_method, headers_json::text, payload_json::text,
        item_status, attempts, created_at, last_attempt_at, next_attempt_at,
        processed_at, queue_index;
    """;

  public async Task<QueueItemDto?> GetNextQueueItemAsync(CancellationToken stoppingToken)
  {
    await DbContext.Database.OpenConnectionAsync(stoppingToken);
    try
    {
      var connection = (NpgsqlConnection)DbContext.Database.GetDbConnection();
      await using var cmd = new NpgsqlCommand(ClaimNextItemSql, connection);
      await using var reader = await cmd.ExecuteReaderAsync(stoppingToken);

      if (!await reader.ReadAsync(stoppingToken))
        return null;

      var headersJson = reader.IsDBNull(4) ? null : reader.GetString(4);
      var payloadJson = reader.IsDBNull(5) ? null : reader.GetString(5);

      return new QueueItemDto
      {
        Id = reader.GetGuid(0),
        CallType = Enum.Parse<ApiCallType>(reader.GetString(1)),
        EndpointUrl = reader.GetString(2),
        HttpMethod = reader.GetString(3),
        HeadersJson = headersJson is null ? null
            : JsonSerializer.Deserialize<Dictionary<string, string>>(headersJson),
        PayloadJson = payloadJson is null ? null
            : JsonSerializer.Deserialize<Dictionary<string, string>>(payloadJson),
        ItemStatus = reader.GetString(6),
        Attempts = reader.GetInt32(7),
        CreatedAt = reader.GetFieldValue<DateTimeOffset>(8),
        LastAttemptAt = reader.IsDBNull(9) ? null : reader.GetFieldValue<DateTimeOffset>(9),
        NextAttemptAt = reader.IsDBNull(10) ? null : reader.GetFieldValue<DateTimeOffset>(10),
        ProcessedAt = reader.IsDBNull(11) ? null : reader.GetFieldValue<DateTimeOffset>(11),
        QueueIndex = reader.GetInt64(12),
      };
    }
    finally
    {
      await DbContext.Database.CloseConnectionAsync();
    }
  }

  public async Task<QueueItemDto> IncrementQueueItemAttemptsAsync(Guid id, CancellationToken stoppingToken)
  {
    var queueItem = await GetQueueItemByIdAsync(id, stoppingToken);

    queueItem.Attempts += 1;
    queueItem.LastAttemptAt = DateTime.UtcNow;

    // Give up after 5 attempts
    if (queueItem.Attempts >= ApiConstants.MaxApiCallAttempts)
    {
      queueItem.ItemStatus = nameof(QueueStatus.Failed);
    }
    else
    {
      // Simple backoff: 30s * Attempts
      queueItem.NextAttemptAt = DateTime.UtcNow.AddSeconds(Math.Min(300, 30 * queueItem.Attempts));
      queueItem.ItemStatus = nameof(QueueStatus.Pending);
    }

    await DbContext.SaveChangesAsync(stoppingToken);

    return queueItem.AsDto();
  }

  public async Task<QueueItemDto> SetQueueItemCompletedAsync(Guid id, CancellationToken stoppingToken)
  {
    var queueItem = await GetQueueItemByIdAsync(id, stoppingToken);

    queueItem.ItemStatus = nameof(QueueStatus.Completed);
    queueItem.ProcessedAt = DateTime.UtcNow;

    await DbContext.SaveChangesAsync(stoppingToken);

    return queueItem.AsDto();
  }

  public async Task RemoveQueueItemsAsync(CancellationToken stoppingToken)
  {
    while (true)
    {
      var items = await DbContext.QueueItems
          .Where(q => q.ItemStatus != nameof(QueueStatus.Failed))
          .OrderBy(q => q.QueueIndex)
          .Take(DatabaseConstants.BulkUpdateSize)
          .ToListAsync(stoppingToken);

      if (items.Count == 0)
      {
        break;
      }

      DbContext.QueueItems.RemoveRange(items);
      await DbContext.SaveChangesAsync(stoppingToken);
    }
  }

  public async Task RemoveQueueItemAsync(Guid id, CancellationToken stoppingToken)
  {
    var itemToRemove = await DbContext.QueueItems.FindAsync(id, stoppingToken)
        ?? throw new Exception($"{nameof(QueueItemEntity)} with ID {id} not found.");

    DbContext.QueueItems.Remove(itemToRemove);
    await DbContext.SaveChangesAsync(stoppingToken);
  }

  private async Task<QueueItemEntity> GetQueueItemByIdAsync(Guid id, CancellationToken stoppingToken)
  {
    var queueItem = await DbContext.QueueItems.FindAsync([id, stoppingToken], stoppingToken);
    return queueItem is null
        ? throw new Exception($"{nameof(QueueItemEntity)} with ID {id} not found.")
        : queueItem;
  }

  private static QueueItemEntity CreateEntityFromDto(QueueItemDto itemDto)
  {
    return new QueueItemEntity
    {
      Id = Guid.NewGuid(),
      CallType = itemDto.CallType.ToString(),
      EndpointUrl = itemDto.EndpointUrl,
      HttpMethod = itemDto.HttpMethod ?? "GET",
      ItemStatus = nameof(QueueStatus.Pending),
      CreatedAt = DateTime.UtcNow,
      QueueIndex = itemDto.QueueIndex,
      NextAttemptAt = itemDto.NextAttemptAt?.ToUniversalTime()
    };
  }
}

