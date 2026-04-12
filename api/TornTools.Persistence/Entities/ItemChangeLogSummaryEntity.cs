using System.ComponentModel.DataAnnotations.Schema;

namespace TornTools.Persistence.Entities;

[Table("item_change_log_summaries", Schema = "public")]
public class ItemChangeLogSummaryEntity
{
  [Column("item_id")]
  public required int ItemId { get; set; }

  [Column("source")]
  public required string Source { get; set; }

  [Column("bucket_start")]
  public required DateTimeOffset BucketStart { get; set; }

  [Column("change_count")]
  public required int ChangeCount { get; set; }

  [Column("sum_price")]
  public required long SumPrice { get; set; }

  [Column("min_price")]
  public required long MinPrice { get; set; }

  [Column("max_price")]
  public required long MaxPrice { get; set; }
}
