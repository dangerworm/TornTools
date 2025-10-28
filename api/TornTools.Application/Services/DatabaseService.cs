using Microsoft.EntityFrameworkCore;
using TornTools.Application.DataTransferObjects;
using TornTools.Core;
using TornTools.Cron.Enums;
using TornTools.Persistence;

namespace TornTools.Application.Services;

public class DatabaseService(TornToolsDbContext dbContext)
{
    private readonly TornToolsDbContext _dbContext = dbContext;

    public async Task<QueueItemDto?> GetNextQueueItem(CancellationToken stoppingToken)
    {
        var now = DateTimeOffset.UtcNow;

        // Find a candidate (oldest pending whose NextAttemptAt is due or null)
        var queueItem = await _dbContext.QueueItems
            .Where(q => q.Status == QueueStatus.Pending &&
                       (q.NextAttemptAt == null || q.NextAttemptAt <= now))
            .OrderBy(q => q.CreatedAt)
            .FirstOrDefaultAsync(stoppingToken);

        if (queueItem is null)
        {
            return null;
        }

        // Attempt to "claim" the item by moving it to InProgress with a concurrency check
        queueItem.Status = QueueStatus.InProgress;

        await _dbContext.SaveChangesAsync(stoppingToken); // if someone else grabbed it, this will fail later via concurrency

        return new QueueItemDto(queueItem);
    }

    public async Task<QueueItemDto?> GetQueueItemById(Guid id)
    {
        var queueItem = await _dbContext.QueueItems.FindAsync(id);
        if (queueItem is null)
        {
            return null;
        }

        return new QueueItemDto(queueItem);
    }

    public async Task<QueueItemDto?> IncrementQueueItemAttempts(Guid id)
    {
        var queueItem = await _dbContext.QueueItems.FindAsync(id);
        if (queueItem is null)
        {
            return null;
        }

        queueItem.Attempts += 1;
        queueItem.LastAttemptAt = DateTimeOffset.UtcNow;

        // Give up after 5 attempts
        if (queueItem.Attempts >= Constants.MaxApiCallAttempts)
        {
            queueItem.Status = QueueStatus.Failed;
        }
        else
        {
            // Simple backoff: 30s * Attempts
            queueItem.NextAttemptAt = DateTimeOffset.UtcNow.AddSeconds(Math.Min(300, 30 * queueItem.Attempts));
            
            queueItem.Status = QueueStatus.Pending;
        }

        await _dbContext.SaveChangesAsync();

        return new QueueItemDto(queueItem);
    }

    public async Task SetQueueItemCompleted(Guid id)
    {
        var queueItem = await GetQueueItemById(id);
        if (queueItem is null)
        {
            return;
        }

        queueItem.Status = QueueStatus.Completed;

        await _dbContext.SaveChangesAsync();
    }
}
