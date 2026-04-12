using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Entities;

public class BazaarSummaryView
{
  [Column("item_id")]
  public int ItemId { get; set; }

  [Column("weav3r_min_price")]
  public long MinPrice { get; set; }

  [Column("quantity")]
  public int Quantity { get; set; }

  [Column("last_updated")]
  public DateTimeOffset LastUpdated { get; set; }

  public BazaarSummaryDto AsDto() => new()
  {
    ItemId = ItemId,
    MinPrice = MinPrice,
    Quantity = Quantity,
    LastUpdated = LastUpdated,
  };
}
