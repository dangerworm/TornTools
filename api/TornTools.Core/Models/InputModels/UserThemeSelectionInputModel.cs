namespace TornTools.Core.Models.InputModels;

public class UserThemeSelectionInputModel
{
    public required long UserId { get; set; }
    public long? ThemeId { get; set; }
}

