namespace TornTools.Core.DataTransferObjects;

public class ProfitableListingDto
{
    public int ItemId { get; set; }
    public string Name { get; set; } = null!;
    public long MinPrice { get; set; }
    public long MaxPrice { get; set; }
    public int Quantity { get; set; }
    public long TotalCost { get; set; }
    public long? CityPrice { get; set; }
    public long MarketPrice { get; set; }
    public DateTime LastUpdated { get; set; }

    public long Profit => CityPrice.HasValue
        ? (CityPrice.Value * Quantity) - TotalCost
        : 0;
}
