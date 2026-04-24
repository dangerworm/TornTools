using TornTools.Core.Enums;

namespace TornTools.Core.DataTransferObjects;

public class ItemVolatilityStatsDto
{
  public required int ItemId { get; set; }
  public required Source Source { get; set; }
  public required DateTimeOffset ComputedAt { get; set; }
  public required int Changes1d { get; set; }
  public required int Changes1w { get; set; }
  public long? CurrentPrice { get; set; }
  public decimal? PriceChange1d { get; set; }
  public decimal? PriceChange1w { get; set; }
}
