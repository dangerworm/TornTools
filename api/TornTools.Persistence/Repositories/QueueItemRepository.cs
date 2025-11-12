using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        // Turn off auto-change detection while doing lots of work
        var wasAutoDetect = DbContext.ChangeTracker.AutoDetectChangesEnabled;
        DbContext.ChangeTracker.AutoDetectChangesEnabled = false;

        try
        {
            var items = itemDtos.ToList();

            for (int i = 0; i < items.Count; i += DatabaseConstants.BulkUpdateSize)
            {
                var batch = items
                    .OrderBy(i => i.CreatedAt)
                    .Skip(i)
                    .Take(DatabaseConstants.BulkUpdateSize)
                    .ToList();

                var keys = batch.Select(b => b.Id).ToList();

                foreach (var itemDto in batch)
                {
                    var newEntity = CreateEntityFromDto(itemDto);
                    DbContext.QueueItems.Add(newEntity);
                }

                await DbContext.SaveChangesAsync(stoppingToken);
                DbContext.ChangeTracker.Clear();
            }
        }
        finally
        {
            DbContext.ChangeTracker.AutoDetectChangesEnabled = wasAutoDetect;
        }
    }

    public async Task<QueueItemDto?> GetNextQueueItemAsync(CancellationToken stoppingToken)
    {
        var now = DateTime.UtcNow;

        // Find a candidate (oldest pending whose NextAttemptAt is due or null)
        var queueItem = await DbContext.QueueItems
            .Where(q => q.ItemStatus == nameof(QueueStatus.Pending) &&
                       (q.NextAttemptAt == null || q.NextAttemptAt <= now))
            .OrderBy(q => q.QueueIndex)
            .FirstOrDefaultAsync(stoppingToken);

        if (queueItem is null)
        {
            return null;
        }

        // Attempt to "claim" the item by moving it to InProgress with a concurrency check
        queueItem.ItemStatus = nameof(QueueStatus.InProgress);

        try
        {
            await DbContext.SaveChangesAsync(stoppingToken); // if someone else grabbed it, this will fail later via concurrency
        }
        catch (DbUpdateConcurrencyException)
        {
            // Another worker took it—just try again
            Logger.LogDebug("Concurrency claim failed for {QueueItem} {Id}. Retrying.", nameof(QueueItemDto), queueItem.Id);
            throw;
        }

        return queueItem.AsDto();
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

    public async Task RemoveQueueItemsAsync(CancellationToken stoppingToken, QueueStatus? statusToRemove = null)
    {
        // Turn off auto-change detection while doing lots of work
        var wasAutoDetect = DbContext.ChangeTracker.AutoDetectChangesEnabled;
        DbContext.ChangeTracker.AutoDetectChangesEnabled = false;
        try
        {
            while (true)
            {
                var completedItems = await DbContext.QueueItems
                    .Where(q => statusToRemove == null || q.ItemStatus == nameof(QueueStatus.Completed))
                    .Where(q => q.ItemStatus != nameof(QueueStatus.Failed))
                    .OrderBy(q => q.QueueIndex)
                    .Take(DatabaseConstants.BulkUpdateSize)
                    .ToListAsync(stoppingToken);

                if (completedItems.Count == 0)
                {
                    break;
                }

                DbContext.QueueItems.RemoveRange(completedItems);
                await DbContext.SaveChangesAsync(stoppingToken);
            }
        }
        finally
        {
            DbContext.ChangeTracker.AutoDetectChangesEnabled = wasAutoDetect;
        }
    }

    public async Task RemoveQueueItemAsync(Guid id, CancellationToken stoppingToken)
    {
        var itemToRemove = await DbContext.QueueItems.FindAsync([id, stoppingToken], cancellationToken: stoppingToken) 
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
            NextAttemptAt = itemDto.NextAttemptAt?.ToUniversalTime()
        };
    }
}

