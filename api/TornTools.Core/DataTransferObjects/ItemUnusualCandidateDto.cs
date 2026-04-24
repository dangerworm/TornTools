using TornTools.Core.Enums;

namespace TornTools.Core.DataTransferObjects;

// One row per (item_id, source) ranked by UnusualnessScore. The widget
// displays WhyFlagged verbatim plus the price/move from whichever
// horizon is dominant.
public class ItemUnusualCandidateDto
{
  public required int ItemId { get; set; }
  public required Source Source { get; set; }
  public required DateTimeOffset ComputedAt { get; set; }

  public long? BaselinePrice { get; set; }
  public decimal? PriceDispersion { get; set; }

  public long? WindowPrice1h { get; set; }
  public int SampleCount1h { get; set; }
  public decimal? MovePct1h { get; set; }
  public decimal? ZScore1h { get; set; }

  public long? WindowPrice6h { get; set; }
  public int SampleCount6h { get; set; }
  public decimal? MovePct6h { get; set; }
  public decimal? ZScore6h { get; set; }

  public long? WindowPrice24h { get; set; }
  public int SampleCount24h { get; set; }
  public decimal? MovePct24h { get; set; }
  public decimal? ZScore24h { get; set; }

  public long? WindowPrice7d { get; set; }
  public int SampleCount7d { get; set; }
  public decimal? MovePct7d { get; set; }
  public decimal? ZScore7d { get; set; }

  public decimal? UnusualnessScore { get; set; }
  public string? DominantHorizon { get; set; }
  public string? Direction { get; set; }

  // Server-formatted phrasing for the widget chip — e.g. "↑ 3.4σ in last
  // 24h vs month". Null when no horizon met its sample threshold.
  public string? WhyFlagged { get; set; }
}
