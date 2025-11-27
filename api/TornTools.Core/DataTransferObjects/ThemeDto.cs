namespace TornTools.Core.DataTransferObjects;

public class ThemeDto
{
    public long Id { get; set; }
    public required string Name { get; set; }
    public required string Mode { get; set; }
    public required string PrimaryColor { get; set; }
    public required string SecondaryColor { get; set; }
    public long? UserId { get; set; }
}
