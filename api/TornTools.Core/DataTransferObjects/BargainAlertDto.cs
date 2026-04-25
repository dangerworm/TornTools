namespace TornTools.Core.DataTransferObjects;

// One row per detected bargain. The frontend joins with ItemsContext
// for name/image, so this DTO stays minimal — no item join here.
public class BargainAlertDto
{
  public long Id { get; set; }
  public required int ItemId { get; set; }
  public required long ListingPrice { get; set; }
  public required long MarketValue { get; set; }
  public required long Profit { get; set; }
  public required DateTimeOffset FoundAt { get; set; }
  public DateTimeOffset? ExpiredAt { get; set; }
  public DateTimeOffset? DismissedAt { get; set; }
  public required string Status { get; set; }
}
