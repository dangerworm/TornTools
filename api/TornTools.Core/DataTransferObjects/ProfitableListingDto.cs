namespace TornTools.Core.DataTransferObjects;

public class ProfitableListingDto
{
  public int ItemId { get; set; }
  public string Name { get; set; } = null!;
  public bool IsFoundInCity { get; set; }
  public long? CityBuyPrice { get; set; }
  public long? CitySellPrice { get; set; }
  public long? MarketPrice { get; set; }

  public long? TornCityMinPrice { get; set; }
  public long? TornCityMaxPrice { get; set; }
  public int? TornCityQuantity { get; set; }
  public long? TornCityTotalProfit { get; set; }

  public long? TornBazaarMinPrice { get; set; }
  public long? TornBazaarMaxPrice { get; set; }
  public int? TornBazaarQuantity { get; set; }
  public long? TornBazaarTotalProfit { get; set; }

  public DateTimeOffset? TornLastUpdated { get; set; }

  public long? Weav3rGlobalMinPrice { get; set; }

  public long? Weav3rCityMinPrice { get; set; }
  public long? Weav3rCityMaxPrice { get; set; }
  public int? Weav3rCityQuantity { get; set; }
  public long? Weav3rCityTotalProfit { get; set; }

  public long? Weav3rMarketMinPrice { get; set; }
  public long? Weav3rMarketMaxPrice { get; set; }
  public int? Weav3rMarketQuantity { get; set; }
  public long? Weav3rMarketTotalProfit { get; set; }

  public long? Weav3rAnonMinPrice { get; set; }
  public long? Weav3rAnonMaxPrice { get; set; }
  public int? Weav3rAnonQuantity { get; set; }
  public long? Weav3rAnonTotalProfit { get; set; }

  public DateTimeOffset? Weav3rLastUpdated { get; set; }
}
