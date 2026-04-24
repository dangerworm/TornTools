namespace TornTools.Core.DataTransferObjects;

public class UserDto
{
  // Only populated on the write path (UpsertUserDetailsAsync). Read paths
  // (AsDto from UserEntity) leave this empty so the plaintext key never
  // leaks past the persistence boundary.
  public string ApiKey { get; set; } = string.Empty;
  public DateTimeOffset? ApiKeyLastUsed { get; set; }
  public bool KeyAvailable { get; set; } = true;
  public long? Id { get; set; }
  public required string Name { get; set; }
  public required int Level { get; set; }
  public int AccessLevel { get; set; } = 1;
  public required string Gender { get; set; }
  public IEnumerable<int> FavouriteItems { get; set; } = [];
}
