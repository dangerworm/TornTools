using TornTools.Core.Enums;

namespace TornTools.Core.DataTransferObjects;

public class ItemVolatilityStatsDto
{
  public required int ItemId { get; set; }
  public required Source Source { get; set; }
  public required DateTimeOffset ComputedAt { get; set; }
  public required int Changes1d { get; set; }
  public required int Changes1w { get; set; }

  // Legacy single-bucket fields — kept during the overlap window.
  public long? CurrentPrice { get; set; }
  public decimal? PriceChange1d { get; set; }
  public decimal? PriceChange1w { get; set; }

  // New: window-median pricing + dispersion + z-scored move.
  public long? WindowPrice { get; set; }
  public long? BaselinePrice { get; set; }
  public int SampleCountRecent { get; set; }
  public int SampleCountBaseline { get; set; }
  public decimal? PriceDispersion { get; set; }
  public decimal? MovePctWindow { get; set; }
  public decimal? MoveZScore1d { get; set; }
}
