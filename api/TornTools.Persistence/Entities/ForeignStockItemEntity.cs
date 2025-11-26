using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Entities;

[Table("foreign_stock_items", Schema = "public")]
public class ForeignStockItemEntity
{
    [Key]
    [Column("item_id")]
    public required int ItemId { get; set; }

    public ItemEntity? Item { get; set; }

    [Column("country")]
    public required string Country { get; set; }

    [Column("item_name")]
    public required string ItemName { get; set; }

    [Column("quantity")]
    public required int Quantity { get; set; }
    
    [Column("cost")]
    public required long Cost { get; set; }
    
    [Column("last_updated")]
    public required DateTime LastUpdated { get; set; }

    public ForeignStockItemDto AsDto()
    {
        return new ForeignStockItemDto
        {
            ItemId = ItemId,
            Item = Item?.AsDto(),
            Country = Country,
            ItemName = ItemName,
            Quantity = Quantity,
            Cost = Cost,
            LastUpdated = LastUpdated
        };
    }
}
