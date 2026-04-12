namespace TornTools.Core.DataTransferObjects;

public class ProfitableListingDto
{
  public int ItemId { get; set; }
  public string Name { get; set; } = null!;
  public bool IsFoundInCity { get; set; }
  public long? CityBuyPrice { get; set; }
  public long? CitySellPrice { get; set; }
  public long? MarketPrice { get; set; }
  public long? TornMinPrice { get; set; }
  public int? TornQuantity { get; set; }
  public DateTimeOffset? TornLastUpdated { get; set; }
  public long? Weav3rMinPrice { get; set; }
  public int? Weav3rQuantity { get; set; }
  public DateTimeOffset? Weav3rLastUpdated { get; set; }
}
