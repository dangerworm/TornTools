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

  [Column("torn_min_price")]
  public long? TornMinPrice { get; set; }

  [Column("torn_quantity")]
  public int? TornQuantity { get; set; }

  [Column("torn_last_updated")]
  public DateTimeOffset? TornLastUpdated { get; set; }

  [Column("weav3r_min_price")]
  public long? Weav3rMinPrice { get; set; }

  [Column("weav3r_quantity")]
  public int? Weav3rQuantity { get; set; }

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
    TornMinPrice = TornMinPrice,
    TornQuantity = TornQuantity,
    TornLastUpdated = TornLastUpdated,
    Weav3rMinPrice = Weav3rMinPrice,
    Weav3rQuantity = Weav3rQuantity,
    Weav3rLastUpdated = Weav3rLastUpdated,
  };
}
