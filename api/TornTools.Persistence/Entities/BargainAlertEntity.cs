using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Entities;

[Table("bargain_alerts", Schema = "public")]
public class BargainAlertEntity
{
  [Column("id")]
  public long Id { get; set; }

  [Column("item_id")]
  public required int ItemId { get; set; }

  [Column("listing_price")]
  public required long ListingPrice { get; set; }

  [Column("market_value")]
  public required long MarketValue { get; set; }

  [Column("profit")]
  public required long Profit { get; set; }

  [Column("found_at")]
  public required DateTimeOffset FoundAt { get; set; }

  [Column("expired_at")]
  public DateTimeOffset? ExpiredAt { get; set; }

  [Column("dismissed_at")]
  public DateTimeOffset? DismissedAt { get; set; }

  [Column("status")]
  public required string Status { get; set; }

  public BargainAlertDto AsDto() => new()
  {
    Id = Id,
    ItemId = ItemId,
    ListingPrice = ListingPrice,
    MarketValue = MarketValue,
    Profit = Profit,
    FoundAt = FoundAt,
    ExpiredAt = ExpiredAt,
    DismissedAt = DismissedAt,
    Status = Status,
  };
}
