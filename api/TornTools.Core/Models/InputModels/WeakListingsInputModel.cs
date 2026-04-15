using System.ComponentModel.DataAnnotations;

namespace TornTools.Core.Models.InputModels;

public class WeakListingsInputModel
{
  [Range(1, int.MaxValue, ErrorMessage = "ItemId must be a positive integer.")]
  public int ItemId { get; set; }

  public List<WeakListingItemModel> Listings { get; set; } = [];
}

public class WeakListingItemModel
{
  [Range(1, long.MaxValue, ErrorMessage = "PlayerId must be a positive integer.")]
  public long PlayerId { get; set; }

  [Range(0, int.MaxValue)]
  public int Quantity { get; set; }

  [Range(0, long.MaxValue)]
  public long Price { get; set; }
}
