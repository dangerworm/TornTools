namespace TornTools.Core.Models.InputModels;

public class BazaarListingInputModel
{
    public required int ItemId { get; set; }
    public long? PlayerId { get; set; }
    public required long Price { get; set; }
    public required int Quantity { get; set; }
    public int? ListingPosition { get; set; }
    public DateTime? TimeSeen { get; set; }
}
