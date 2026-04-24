using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Persistence.Entities;

[Table("item_unusual_candidates", Schema = "public")]
public class ItemUnusualCandidatesEntity
{
  [Column("item_id")]
  public required int ItemId { get; set; }

  [Column("source")]
  public required string Source { get; set; }

  [Column("computed_at")]
  public required DateTimeOffset ComputedAt { get; set; }

  // Shared baseline used by every horizon: 30d trimmed median price +
  // CV of daily medians for dispersion. Both null until enough history
  // accumulates per the rebuild's min-sample thresholds.
  [Column("baseline_price")] public long? BaselinePrice { get; set; }
  [Column("price_dispersion")] public decimal? PriceDispersion { get; set; }

  [Column("window_price_1h")] public long? WindowPrice1h { get; set; }
  [Column("sample_count_1h")] public int SampleCount1h { get; set; }
  [Column("move_pct_1h")] public decimal? MovePct1h { get; set; }
  [Column("z_score_1h")] public decimal? ZScore1h { get; set; }

  [Column("window_price_6h")] public long? WindowPrice6h { get; set; }
  [Column("sample_count_6h")] public int SampleCount6h { get; set; }
  [Column("move_pct_6h")] public decimal? MovePct6h { get; set; }
  [Column("z_score_6h")] public decimal? ZScore6h { get; set; }

  [Column("window_price_24h")] public long? WindowPrice24h { get; set; }
  [Column("sample_count_24h")] public int SampleCount24h { get; set; }
  [Column("move_pct_24h")] public decimal? MovePct24h { get; set; }
  [Column("z_score_24h")] public decimal? ZScore24h { get; set; }

  [Column("window_price_7d")] public long? WindowPrice7d { get; set; }
  [Column("sample_count_7d")] public int SampleCount7d { get; set; }
  [Column("move_pct_7d")] public decimal? MovePct7d { get; set; }
  [Column("z_score_7d")] public decimal? ZScore7d { get; set; }

  [Column("unusualness_score")] public decimal? UnusualnessScore { get; set; }
  [Column("dominant_horizon")] public string? DominantHorizon { get; set; }
  [Column("direction")] public string? Direction { get; set; }

  public ItemUnusualCandidateDto AsDto() => new()
  {
    ItemId = ItemId,
    Source = Enum.Parse<Source>(Source),
    ComputedAt = ComputedAt,
    BaselinePrice = BaselinePrice,
    PriceDispersion = PriceDispersion,
    WindowPrice1h = WindowPrice1h,
    SampleCount1h = SampleCount1h,
    MovePct1h = MovePct1h,
    ZScore1h = ZScore1h,
    WindowPrice6h = WindowPrice6h,
    SampleCount6h = SampleCount6h,
    MovePct6h = MovePct6h,
    ZScore6h = ZScore6h,
    WindowPrice24h = WindowPrice24h,
    SampleCount24h = SampleCount24h,
    MovePct24h = MovePct24h,
    ZScore24h = ZScore24h,
    WindowPrice7d = WindowPrice7d,
    SampleCount7d = SampleCount7d,
    MovePct7d = MovePct7d,
    ZScore7d = ZScore7d,
    UnusualnessScore = UnusualnessScore,
    DominantHorizon = DominantHorizon,
    Direction = Direction,
    WhyFlagged = FormatWhyFlagged(),
  };

  // Server-side phrasing for the "why flagged" chip. Sticky once shipped
  // — clients consume the formatted string verbatim.
  private string? FormatWhyFlagged()
  {
    if (UnusualnessScore is null || DominantHorizon is null || Direction is null)
    {
      return null;
    }

    var arrow = Direction == "up" ? "↑" : "↓";
    var horizonLabel = DominantHorizon switch
    {
      "1h" => "in last hour",
      "6h" => "in last 6h",
      "24h" => "in last day",
      "7d" => "in last week",
      _ => $"in {DominantHorizon}",
    };
    return $"{arrow} {Math.Abs(UnusualnessScore.Value):F1}σ {horizonLabel} vs month";
  }
}
