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

  // Legacy single-bucket values — kept populated during the overlap
  // window, no longer the basis for the Top Movers ranking.
  [Column("current_price")]
  public long? CurrentPrice { get; set; }

  [Column("price_change_1d")]
  public decimal? PriceChange1d { get; set; }

  [Column("price_change_1w")]
  public decimal? PriceChange1w { get; set; }

  // New columns from the Top Movers redesign (V1.21). See the migration
  // file for semantics. The ranking metric (z-score) is derived at read
  // time as MovePctWindow / PriceDispersion.
  [Column("window_price")]
  public long? WindowPrice { get; set; }

  [Column("baseline_price")]
  public long? BaselinePrice { get; set; }

  [Column("sample_count_recent")]
  public int SampleCountRecent { get; set; }

  [Column("sample_count_baseline")]
  public int SampleCountBaseline { get; set; }

  [Column("price_dispersion")]
  public decimal? PriceDispersion { get; set; }

  [Column("move_pct_window")]
  public decimal? MovePctWindow { get; set; }

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
    WindowPrice = WindowPrice,
    BaselinePrice = BaselinePrice,
    SampleCountRecent = SampleCountRecent,
    SampleCountBaseline = SampleCountBaseline,
    PriceDispersion = PriceDispersion,
    MovePctWindow = MovePctWindow,
    MoveZScore1d = (MovePctWindow is not null && PriceDispersion is > 0)
        ? MovePctWindow / PriceDispersion
        : null,
  };
}
