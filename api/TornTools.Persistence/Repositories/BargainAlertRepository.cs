using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TornTools.Core.DataTransferObjects;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;

public class BargainAlertRepository(
    ILogger<BargainAlertRepository> logger,
    TornToolsDbContext dbContext
) : RepositoryBase<BargainAlertRepository>(logger, dbContext), IBargainAlertRepository
{
  private const string StatusActive = "active";
  private const string StatusExpired = "expired";
  private const string StatusDismissed = "dismissed";

  public async Task<BargainAlertDto> CreateAsync(
      int itemId,
      long listingPrice,
      long marketValue,
      CancellationToken stoppingToken)
  {
    var entity = new BargainAlertEntity
    {
      ItemId = itemId,
      ListingPrice = listingPrice,
      MarketValue = marketValue,
      Profit = marketValue - listingPrice,
      FoundAt = DateTimeOffset.UtcNow,
      Status = StatusActive,
    };

    DbContext.Set<BargainAlertEntity>().Add(entity);
    await DbContext.SaveChangesAsync(stoppingToken);

    return entity.AsDto();
  }

  public async Task<BargainAlertDto?> GetActiveByItemAsync(int itemId, CancellationToken stoppingToken)
  {
    var entity = await DbContext.Set<BargainAlertEntity>()
        .AsNoTracking()
        .Where(a => a.ItemId == itemId && a.Status == StatusActive)
        .FirstOrDefaultAsync(stoppingToken);
    return entity?.AsDto();
  }

  public async Task<BargainAlertDto?> GetByIdAsync(long id, CancellationToken stoppingToken)
  {
    var entity = await DbContext.Set<BargainAlertEntity>()
        .AsNoTracking()
        .FirstOrDefaultAsync(a => a.Id == id, stoppingToken);
    return entity?.AsDto();
  }

  public async Task<IEnumerable<BargainAlertDto>> GetAllActiveAsync(CancellationToken stoppingToken)
  {
    var entities = await DbContext.Set<BargainAlertEntity>()
        .AsNoTracking()
        .Where(a => a.Status == StatusActive)
        .OrderByDescending(a => a.FoundAt)
        .ToListAsync(stoppingToken);
    return entities.Select(e => e.AsDto());
  }

  public async Task<bool> MarkExpiredAsync(long id, CancellationToken stoppingToken)
  {
    // Single-statement update so we don't fight the unique partial
    // index on (item_id) WHERE status='active' if a fresh alert opened
    // for the same item between read and write.
    var rows = await DbContext.Set<BargainAlertEntity>()
        .Where(a => a.Id == id && a.Status == StatusActive)
        .ExecuteUpdateAsync(s => s
            .SetProperty(a => a.Status, StatusExpired)
            .SetProperty(a => a.ExpiredAt, DateTimeOffset.UtcNow),
            stoppingToken);
    return rows > 0;
  }

  public async Task<bool> MarkDismissedAsync(long id, CancellationToken stoppingToken)
  {
    var rows = await DbContext.Set<BargainAlertEntity>()
        .Where(a => a.Id == id && a.Status == StatusActive)
        .ExecuteUpdateAsync(s => s
            .SetProperty(a => a.Status, StatusDismissed)
            .SetProperty(a => a.DismissedAt, DateTimeOffset.UtcNow),
            stoppingToken);
    return rows > 0;
  }

  public async Task<IReadOnlyCollection<int>> GetActiveItemIdsAsync(CancellationToken stoppingToken)
  {
    return await DbContext.Set<BargainAlertEntity>()
        .AsNoTracking()
        .Where(a => a.Status == StatusActive)
        .Select(a => a.ItemId)
        .Distinct()
        .ToListAsync(stoppingToken);
  }
}
