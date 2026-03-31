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

  public ICollection<UserFavouriteItemEntity> FavouriteItems { get; set; } = [];

  [Column("preferred_theme_id")]
  public long? PreferredThemeId { get; set; }

  public ThemeEntity? PreferredTheme { get; set; }
  public ICollection<ThemeEntity> CustomThemes { get; set; } = [];

  public UserDto AsDto()
  {
    return new UserDto
    {
      Id = Id,
      ApiKey = ApiKey,
      ApiKeyLastUsed = ApiKeyLastUsed,
      KeyAvailable = KeyAvailable,
      Name = Name,
      Gender = Gender,
      Level = Level,
      FavouriteItems = FavouriteItems.Select(f => f.ItemId),
      PreferredThemeId = PreferredThemeId,
      PreferredTheme = PreferredTheme?.AsDto()
    };
  }
}
