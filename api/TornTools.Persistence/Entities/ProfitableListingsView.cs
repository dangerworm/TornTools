using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Entities;

public class ProfitableListingView
{
    [Column("item_id")]
    public int ItemId { get; set; }
    
    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("min_price")]
    public long MinPrice { get; set; }

    [Column("max_price")]
    public long MaxPrice { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; }

    [Column("total_cost")]
    public long TotalCost { get; set; }

    [Column("city_price")]
    public long CityPrice { get; set; }

    [Column("market_price")]
    public long MarketPrice { get; set; }

    [Column("last_updated")]
    public DateTime LastUpdated { get; set; }

    public ProfitableListingDto AsDto()
    {
        return new ProfitableListingDto
        {
            ItemId = ItemId,
            Name = Name,
            MinPrice = MinPrice,
            MaxPrice = MaxPrice,
            Quantity = Quantity,
            TotalCost = TotalCost,
            CityPrice = CityPrice,
            MarketPrice = MarketPrice,
            LastUpdated = LastUpdated
        };
    }
}

