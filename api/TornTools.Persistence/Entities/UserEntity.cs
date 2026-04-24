using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Entities;

[Table("users", Schema = "public")]
public class UserEntity
{
  [Key]
  [Column("id")]
  public long? Id { get; set; }

  [Required]
  [Column("api_key")]
  public required string ApiKey { get; set; }

  // Populated by UpsertUserDetailsAsync via IApiKeyProtector. Reads prefer
  // this column; the plaintext ApiKey stays as a fallback until the post-
  // release migration drops it.
  [Column("api_key_encrypted")]
  public byte[]? ApiKeyEncrypted { get; set; }

  [Column("api_key_last_used")]
  public DateTimeOffset? ApiKeyLastUsed { get; set; }

  [Column("key_available")]
  public bool KeyAvailable { get; set; }

  [Required]
  [Column("name")]
  public required string Name { get; set; }

  [Required]
  [Column("gender")]
  public required string Gender { get; set; }

  [Required]
  [Column("level")]
  public required int Level { get; set; }

  [Column("access_level")]
  public int AccessLevel { get; set; } = 1;

  public ICollection<UserFavouriteItemEntity> FavouriteItems { get; set; } = [];

  public UserDto AsDto()
  {
    return new UserDto
    {
      Id = Id,
      // Plaintext deliberately NOT copied — read-side DTOs must not carry
      // the Torn API key past the persistence boundary. Write paths that
      // genuinely need to send a key pass a fresh UserDto with ApiKey set.
      ApiKey = string.Empty,
      ApiKeyLastUsed = ApiKeyLastUsed,
      KeyAvailable = KeyAvailable,
      Name = Name,
      Gender = Gender,
      Level = Level,
      AccessLevel = AccessLevel,
      FavouriteItems = FavouriteItems.Select(f => f.ItemId)
    };
  }
}
