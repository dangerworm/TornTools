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
  public long? TornCityQuantity { get; set; }
  public decimal? TornCityTotalProfit { get; set; }

  public long? TornBazaarMinPrice { get; set; }
  public long? TornBazaarMaxPrice { get; set; }
  public long? TornBazaarQuantity { get; set; }
  public decimal? TornBazaarTotalProfit { get; set; }

  public DateTimeOffset? TornLastUpdated { get; set; }

  public long? Weav3rGlobalMinPrice { get; set; }

  public long? Weav3rCityMinPrice { get; set; }
  public long? Weav3rCityMaxPrice { get; set; }
  public long? Weav3rCityQuantity { get; set; }
  public decimal? Weav3rCityTotalProfit { get; set; }

  public long? Weav3rMarketMinPrice { get; set; }
  public long? Weav3rMarketMaxPrice { get; set; }
  public long? Weav3rMarketQuantity { get; set; }
  public decimal? Weav3rMarketTotalProfit { get; set; }

  public long? Weav3rAnonMinPrice { get; set; }
  public long? Weav3rAnonMaxPrice { get; set; }
  public long? Weav3rAnonQuantity { get; set; }
  public decimal? Weav3rAnonTotalProfit { get; set; }

  public DateTimeOffset? Weav3rLastUpdated { get; set; }
}
