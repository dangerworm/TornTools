namespace TornTools.Core.Models.InputModels;

public class UserFavouriteInputModel
{
    public required long UserId { get; set; }
    public required int ItemId { get; set; }
    public required bool Add { get; set; }
}
