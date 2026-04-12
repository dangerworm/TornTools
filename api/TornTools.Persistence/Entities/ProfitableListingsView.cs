using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Entities;

public class ProfitableListingView
{
  [Column("item_id")]
  public int ItemId { get; set; }

  [Column("name")]
  public string Name { get; set; } = null!;

  [Column("is_found_in_city")]
  public bool IsFoundInCity { get; set; }

  [Column("city_buy_price")]
  public long? CityBuyPrice { get; set; }

  [Column("city_sell_price")]
  public long? CitySellPrice { get; set; }

  [Column("market_price")]
  public long? MarketPrice { get; set; }

  [Column("torn_city_min_price")]
  public long? TornCityMinPrice { get; set; }

  [Column("torn_city_max_price")]
  public long? TornCityMaxPrice { get; set; }

  [Column("torn_city_quantity")]
  public int? TornCityQuantity { get; set; }

  [Column("torn_city_total_profit")]
  public long? TornCityTotalProfit { get; set; }

  [Column("torn_bazaar_min_price")]
  public long? TornBazaarMinPrice { get; set; }

  [Column("torn_bazaar_max_price")]
  public long? TornBazaarMaxPrice { get; set; }

  [Column("torn_bazaar_quantity")]
  public int? TornBazaarQuantity { get; set; }

  [Column("torn_bazaar_total_profit")]
  public long? TornBazaarTotalProfit { get; set; }

  [Column("torn_last_updated")]
  public DateTimeOffset? TornLastUpdated { get; set; }

  [Column("weav3r_global_min_price")]
  public long? Weav3rGlobalMinPrice { get; set; }

  [Column("weav3r_city_min_price")]
  public long? Weav3rCityMinPrice { get; set; }

  [Column("weav3r_city_max_price")]
  public long? Weav3rCityMaxPrice { get; set; }

  [Column("weav3r_city_quantity")]
  public int? Weav3rCityQuantity { get; set; }

  [Column("weav3r_city_total_profit")]
  public long? Weav3rCityTotalProfit { get; set; }

  [Column("weav3r_market_min_price")]
  public long? Weav3rMarketMinPrice { get; set; }

  [Column("weav3r_market_max_price")]
  public long? Weav3rMarketMaxPrice { get; set; }

  [Column("weav3r_market_quantity")]
  public int? Weav3rMarketQuantity { get; set; }

  [Column("weav3r_market_total_profit")]
  public long? Weav3rMarketTotalProfit { get; set; }

  [Column("weav3r_anon_min_price")]
  public long? Weav3rAnonMinPrice { get; set; }

  [Column("weav3r_anon_max_price")]
  public long? Weav3rAnonMaxPrice { get; set; }

  [Column("weav3r_anon_quantity")]
  public int? Weav3rAnonQuantity { get; set; }

  [Column("weav3r_anon_total_profit")]
  public long? Weav3rAnonTotalProfit { get; set; }

  [Column("weav3r_last_updated")]
  public DateTimeOffset? Weav3rLastUpdated { get; set; }

  public ProfitableListingDto AsDto() => new()
  {
    ItemId = ItemId,
    Name = Name,
    IsFoundInCity = IsFoundInCity,
    CityBuyPrice = CityBuyPrice,
    CitySellPrice = CitySellPrice,
    MarketPrice = MarketPrice,
    TornCityMinPrice = TornCityMinPrice,
    TornCityMaxPrice = TornCityMaxPrice,
    TornCityQuantity = TornCityQuantity,
    TornCityTotalProfit = TornCityTotalProfit,
    TornBazaarMinPrice = TornBazaarMinPrice,
    TornBazaarMaxPrice = TornBazaarMaxPrice,
    TornBazaarQuantity = TornBazaarQuantity,
    TornBazaarTotalProfit = TornBazaarTotalProfit,
    TornLastUpdated = TornLastUpdated,
    Weav3rGlobalMinPrice = Weav3rGlobalMinPrice,
    Weav3rCityMinPrice = Weav3rCityMinPrice,
    Weav3rCityMaxPrice = Weav3rCityMaxPrice,
    Weav3rCityQuantity = Weav3rCityQuantity,
    Weav3rCityTotalProfit = Weav3rCityTotalProfit,
    Weav3rMarketMinPrice = Weav3rMarketMinPrice,
    Weav3rMarketMaxPrice = Weav3rMarketMaxPrice,
    Weav3rMarketQuantity = Weav3rMarketQuantity,
    Weav3rMarketTotalProfit = Weav3rMarketTotalProfit,
    Weav3rAnonMinPrice = Weav3rAnonMinPrice,
    Weav3rAnonMaxPrice = Weav3rAnonMaxPrice,
    Weav3rAnonQuantity = Weav3rAnonQuantity,
    Weav3rAnonTotalProfit = Weav3rAnonTotalProfit,
    Weav3rLastUpdated = Weav3rLastUpdated,
  };
}
