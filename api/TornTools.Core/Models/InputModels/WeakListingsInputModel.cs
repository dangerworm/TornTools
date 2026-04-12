namespace TornTools.Core.Models.InputModels;

public class WeakListingsInputModel
{
  public int ItemId { get; set; }
  public List<WeakListingItemModel> Listings { get; set; } = [];
}

public class WeakListingItemModel
{
  public long PlayerId { get; set; }
  public int Quantity { get; set; }
  public long Price { get; set; }
}
