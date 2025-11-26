namespace TornTools.Core.DataTransferObjects;

public class ForeignStockItemDto
{
    public required int ItemId { get; set; }
    public ItemDto? Item { get; set; }
    public required string Country { get; set; }
    public required string ItemName { get; set; }
    public required int Quantity { get; set; }
    public required long Cost { get; set; }
    public required DateTime LastUpdated { get; set; }
}
