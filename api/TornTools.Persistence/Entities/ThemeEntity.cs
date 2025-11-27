using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Entities;

[Table("themes", Schema = "public")]
public class ThemeEntity
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("name")]
    public required string Name { get; set; }

    [Required]
    [Column("mode")]
    public required string Mode { get; set; }

    [Required]
    [Column("primary_color")]
    public required string PrimaryColor { get; set; }

    [Required]
    [Column("secondary_color")]
    public required string SecondaryColor { get; set; }

    [Column("user_id")]
    public long? UserId { get; set; }

    public UserEntity? User { get; set; }

    public ThemeDto AsDto()
    {
        return new ThemeDto
        {
            Id = Id,
            Name = Name,
            Mode = Mode,
            PrimaryColor = PrimaryColor,
            SecondaryColor = SecondaryColor,
            UserId = UserId
        };
    }
}

