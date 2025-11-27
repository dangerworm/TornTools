namespace TornTools.Core.Models.InputModels;

public class ThemeInputModel
{
    public long? Id { get; set; }
    public long? UserId { get; set; }
    public required string Name { get; set; }
    public required string Mode { get; set; }
    public required string PrimaryColor { get; set; }
    public required string SecondaryColor { get; set; }
}

