using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;

public interface IBargainAlertRepository
{
  // Insert a new active alert. Returns the populated DTO (with Id +
  // FoundAt assigned by the DB). Throws on idempotency-guard violation
  // (unique partial index on item_id WHERE status='active') — the
  // caller is expected to pre-check via GetActiveByItemAsync.
  Task<BargainAlertDto> CreateAsync(int itemId, long listingPrice, long marketValue, CancellationToken stoppingToken);

  // Returns the single active alert for an item, or null if none.
  // Used by the detection hook for idempotency and by the dismiss
  // endpoint for existence checks.
  Task<BargainAlertDto?> GetActiveByItemAsync(int itemId, CancellationToken stoppingToken);

  // Returns the row by primary key, or null. Used by the dismiss
  // endpoint to disambiguate "already dismissed" vs "doesn't exist".
  Task<BargainAlertDto?> GetByIdAsync(long id, CancellationToken stoppingToken);

  // Returns all currently-active alerts ordered by FoundAt DESC.
  // This is the payload the toast UI polls.
  Task<IEnumerable<BargainAlertDto>> GetAllActiveAsync(CancellationToken stoppingToken);

  // Transition an alert from active → expired (listing has gone). Sets
  // expired_at = now. No-op if the row is not active.
  Task<bool> MarkExpiredAsync(long id, CancellationToken stoppingToken);

  // Transition an alert from active → dismissed (user clicked dismiss).
  // Sets dismissed_at = now. No-op if the row is not active.
  Task<bool> MarkDismissedAsync(long id, CancellationToken stoppingToken);

  // Returns the set of item IDs that currently have an active alert.
  // Used by TornMarketsProcessor to maintain its hot-set for the
  // snipe-loop without loading full DTOs.
  Task<IReadOnlyCollection<int>> GetActiveItemIdsAsync(CancellationToken stoppingToken);
}
