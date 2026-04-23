namespace TornTools.Core.DataTransferObjects;

public class UserDto
{
  public required string ApiKey { get; set; }
  public DateTimeOffset? ApiKeyLastUsed { get; set; }
  public bool KeyAvailable { get; set; } = true;
  public long? Id { get; set; }
  public required string Name { get; set; }
  public required int Level { get; set; }
  public int AccessLevel { get; set; } = 1;
  public required string Gender { get; set; }
  public IEnumerable<int> FavouriteItems { get; set; } = [];
}
