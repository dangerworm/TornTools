using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Persistence.Interfaces;

namespace TornTools.Application.Services;

public class BargainAlertService(
    ILogger<BargainAlertService> logger,
    IBargainAlertRepository bargainAlertRepository,
    IItemRepository itemRepository
) : IBargainAlertService
{
  // Threshold: a listing is a "bargain" when the per-unit profit
  // against the city sell-back price exceeds this. City sell-back has
  // no tax so this is the realisable per-unit profit.
  public const long ProfitThreshold = 5_000;

  private readonly ILogger<BargainAlertService> _logger = logger;
  private readonly IBargainAlertRepository _bargainAlertRepository = bargainAlertRepository;
  private readonly IItemRepository _itemRepository = itemRepository;

  public async Task EvaluateAsync(
      Source source,
      int itemId,
      IReadOnlyList<ListingDto> newListings,
      CancellationToken stoppingToken)
  {
    if (source != Source.Torn)
    {
      return;
    }

    var item = await _itemRepository.GetItemAsync(itemId, stoppingToken);
    if (item?.ValueSellPrice is null or <= 0)
    {
      // Item has no city sell-back baseline — no way to evaluate profit.
      // Skip silently; common for masked / non-tradable items.
      return;
    }

    var sellPrice = item.ValueSellPrice.Value;
    var existing = await _bargainAlertRepository.GetActiveByItemAsync(itemId, stoppingToken);

    var cheapest = newListings
        .Where(l => l.Price > 0)
        .OrderBy(l => l.Price)
        .FirstOrDefault();

    var qualifies = cheapest is not null && (sellPrice - cheapest.Price) > ProfitThreshold;

    if (qualifies && existing is null)
    {
      var listingPrice = cheapest!.Price;
      _logger.LogInformation(
          "Bargain detected for item {ItemId}: listing {ListingPrice} vs sell {SellPrice} (profit {Profit}).",
          itemId, listingPrice, sellPrice, sellPrice - listingPrice);

      try
      {
        await _bargainAlertRepository.CreateAsync(itemId, listingPrice, sellPrice, stoppingToken);
      }
      catch (Exception ex)
      {
        // Likely a unique-index race — another worker beat us to it.
        // Treat as success (the alert exists either way).
        _logger.LogDebug(ex, "Bargain alert insert race for item {ItemId} — alert already exists.", itemId);
      }
    }
    else if (!qualifies && existing is not null)
    {
      _logger.LogInformation(
          "Bargain expired for item {ItemId} (alert {AlertId}): no qualifying listing in latest scan.",
          itemId, existing.Id);

      await _bargainAlertRepository.MarkExpiredAsync(existing.Id, stoppingToken);
    }
    // qualifies && existing is not null → idempotent leave-alone
    // !qualifies && existing is null    → nothing to do
  }

  public Task<IEnumerable<BargainAlertDto>> GetActiveAlertsAsync(CancellationToken stoppingToken)
      => _bargainAlertRepository.GetAllActiveAsync(stoppingToken);

  public Task<bool> DismissAsync(long alertId, CancellationToken stoppingToken)
      => _bargainAlertRepository.MarkDismissedAsync(alertId, stoppingToken);
}
