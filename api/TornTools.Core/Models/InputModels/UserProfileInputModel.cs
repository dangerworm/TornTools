namespace TornTools.Core.Models.InputModels;

public class UserProfileInputModel
{
    public required long Id { get; set; }
    public required string Name { get; set; }
    public required int Level { get; set; }
    public required string Gender { get; set; }
}
