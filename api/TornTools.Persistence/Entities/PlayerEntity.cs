using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TornTools.Persistence.Entities;

[Table("players", Schema = "public")]
public class PlayerEntity
{
    [Key]
    [Column("id")]
    public long Id { get; set; } // int8 = long in C#

    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column("level")]
    public int Level { get; set; } // int4 = int

    [Required]
    [Column("gender")]
    public string Gender { get; set; } = string.Empty;
}
