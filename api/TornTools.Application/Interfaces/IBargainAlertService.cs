using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;

public interface IBargainAlertService
{
  // Called from the listings-write path after listings have been
  // replaced. Decides whether to open, leave, or expire an active alert
  // for this item:
  //
  //   * source != Torn          → no-op (markets-only in v1)
  //   * any new listing's profit > threshold AND no active alert
  //                              → open a new alert at the cheapest
  //                                qualifying price
  //   * no qualifying listing AND active alert exists
  //                              → expire the existing alert
  //   * any other combination   → no-op
  //
  // Idempotent: safe to call multiple times for the same listings batch.
  Task EvaluateAsync(
      Source source,
      int itemId,
      IReadOnlyList<ListingDto> newListings,
      CancellationToken stoppingToken);

  // All currently-active alerts, ordered by FoundAt DESC. The v1 toast
  // UI renders this list directly.
  Task<IEnumerable<BargainAlertDto>> GetActiveAlertsAsync(CancellationToken stoppingToken);

  // Mark an alert dismissed. Returns true if the alert was active and
  // is now dismissed; false if the alert doesn't exist or wasn't active
  // (already expired/dismissed). Idempotent.
  Task<bool> DismissAsync(long alertId, CancellationToken stoppingToken);
}
