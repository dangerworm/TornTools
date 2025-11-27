namespace TornTools.Core.DataTransferObjects;

public class UserDto
{
    public required string ApiKey { get; set; }
    public DateTime? ApiKeyLastUsed { get; set; }
    public long? Id { get; set; }
    public required string Name { get; set; }
    public required int Level { get; set; }
    public required string Gender { get; set; }
    public IEnumerable<int> FavouriteItems { get; set; } = [];
    public long? PreferredThemeId { get; set; }
    public ThemeDto? PreferredTheme { get; set; }
}
