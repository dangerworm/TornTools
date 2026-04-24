using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Persistence.Entities;

[Table("item_volatility_stats", Schema = "public")]
public class ItemVolatilityStatsEntity
{
  [Column("item_id")]
  public required int ItemId { get; set; }

  [Column("source")]
  public required string Source { get; set; }

  [Column("computed_at")]
  public required DateTimeOffset ComputedAt { get; set; }

  [Column("changes_1d")]
  public required int Changes1d { get; set; }

  [Column("changes_1w")]
  public required int Changes1w { get; set; }

  [Column("current_price")]
  public long? CurrentPrice { get; set; }

  [Column("price_change_1d")]
  public decimal? PriceChange1d { get; set; }

  [Column("price_change_1w")]
  public decimal? PriceChange1w { get; set; }

  public ItemVolatilityStatsDto AsDto() => new()
  {
    ItemId = ItemId,
    Source = Enum.Parse<Source>(Source),
    ComputedAt = ComputedAt,
    Changes1d = Changes1d,
    Changes1w = Changes1w,
    CurrentPrice = CurrentPrice,
    PriceChange1d = PriceChange1d,
    PriceChange1w = PriceChange1w,
  };
}
