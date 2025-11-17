namespace TornTools.Core.DataTransferObjects;

public class UserDto
{
    public long? Id { get; set; }
    public required string ApiKey { get; set; }
    public DateTime? ApiKeyLastUsed { get; set; }
    public required string Name { get; set; }
    public required string Gender { get; set; }
}
