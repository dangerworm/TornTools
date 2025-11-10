namespace TornTools.Core.DataTransferObjects;

public class ProfitableListingDto
{
    public int ItemId { get; set; }
    public string Name { get; set; } = null!;
    public long MinPrice { get; set; }
    public long MaxPrice { get; set; }
    public long SellPrice { get; set; }
    public int Quantity { get; set; }
    public long Profit { get; set; }
    public DateTime LastUpdated { get; set; }
}
