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

  // AES-GCM ciphertext of the Torn API key. Layout is
  // [1 byte version][12 byte nonce][16 byte tag][ciphertext]; resolved by
  // IApiKeyProtector. Required in practice (every row has one after the
  // Phase 1 backfill and the V1.20 drop of the legacy plaintext column)
  // but kept nullable so a partially-provisioned row during user creation
  // doesn't trip a NOT NULL constraint before the upsert populates it.
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
      // Read-side DTOs don't carry the Torn API key. Write paths build a
      // UserDto from scratch with ApiKey populated.
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
