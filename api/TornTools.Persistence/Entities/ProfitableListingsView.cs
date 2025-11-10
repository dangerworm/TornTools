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

    [Column("sell_price")]
    public long SellPrice { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; }

    [Column("profit")]
    public long Profit { get; set; }

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
            SellPrice = SellPrice,
            Quantity = Quantity,
            Profit = Profit,
            LastUpdated = LastUpdated
        };
    }
}

