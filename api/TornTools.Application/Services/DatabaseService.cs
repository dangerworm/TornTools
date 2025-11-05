using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Cron.Enums;
using TornTools.Persistence;
using TornTools.Persistence.Entities;

namespace TornTools.Application.Services;

public class DatabaseService(ILogger<DatabaseService> logger, TornToolsDbContext dbContext) : IDatabaseService
{
    private readonly ILogger<DatabaseService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly TornToolsDbContext _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));

    public async Task<QueueItemDto> CreateQueueItem(string endpointUrl, CancellationToken stoppingToken)
    {
        var queueItem = new QueueItemEntity
        {
            CallType = "Torn",
            EndpointUrl = endpointUrl,
            HttpMethod = "GET",
            ItemStatus = nameof(QueueStatus.Pending),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.QueueItems.Add(queueItem);
        await _dbContext.SaveChangesAsync(stoppingToken);
        return queueItem.AsDto();
    }

    public async Task<QueueItemDto?> GetNextQueueItem(CancellationToken stoppingToken)
    {
        var now = DateTimeOffset.UtcNow;

        // Find a candidate (oldest pending whose NextAttemptAt is due or null)
        var queueItem = await _dbContext.QueueItems
            .Where(q => q.ItemStatus == nameof(QueueStatus.Pending) &&
                       (q.NextAttemptAt == null || q.NextAttemptAt <= now))
            .OrderBy(q => q.CreatedAt)
            .FirstOrDefaultAsync(stoppingToken);

        if (queueItem is null)
        {
            return null;
        }

        // Attempt to "claim" the item by moving it to InProgress with a concurrency check
        queueItem.ItemStatus = nameof(QueueStatus.InProgress);

        try
        {
            await _dbContext.SaveChangesAsync(stoppingToken); // if someone else grabbed it, this will fail later via concurrency
        }
        catch (DbUpdateConcurrencyException)
        {
            // Another worker took it—just try again
            _logger.LogDebug("Concurrency claim failed for QueueItem {Id}. Retrying.", queueItem.Id);
            throw;
        }

        return queueItem.AsDto();
    }

    public async Task<QueueItemDto> IncrementQueueItemAttempts(Guid id)
    {
        var queueItem = await GetQueueItemById(id);

        queueItem.Attempts += 1;
        queueItem.LastAttemptAt = DateTimeOffset.UtcNow;

        // Give up after 5 attempts
        if (queueItem.Attempts >= ApiConstants.MaxApiCallAttempts)
        {
            queueItem.ItemStatus = nameof(QueueStatus.Failed);
        }
        else
        {
            // Simple backoff: 30s * Attempts
            queueItem.NextAttemptAt = DateTimeOffset.UtcNow.AddSeconds(Math.Min(300, 30 * queueItem.Attempts));

            queueItem.ItemStatus = nameof(QueueStatus.Pending);
        }

        await _dbContext.SaveChangesAsync();

        return queueItem.AsDto();
    }

    public async Task<QueueItemDto> SetQueueItemCompleted(Guid id)
    {
        var queueItem = await GetQueueItemById(id);

        queueItem.ItemStatus = nameof(QueueStatus.Completed);
        queueItem.ProcessedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        return queueItem.AsDto();
    }

    private async Task<QueueItemEntity> GetQueueItemById(Guid id)
    {
        var queueItem = await _dbContext.QueueItems.FindAsync(id);
        return queueItem is null
            ? throw new Exception($"QueueItem with ID {id} not found.")
            : queueItem;
    }
}
