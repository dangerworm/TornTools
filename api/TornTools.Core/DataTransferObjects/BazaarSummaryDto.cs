namespace TornTools.Core.DataTransferObjects;

public class BazaarSummaryDto
{
  public int ItemId { get; set; }
  public long MinPrice { get; set; }
  public int Quantity { get; set; }
  public DateTimeOffset LastUpdated { get; set; }
}
