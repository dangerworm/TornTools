using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Cron.Enums;

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
    public DateTime? ApiKeyLastUsed { get; set; }

    [Required]
    [Column("name")]
    public required string Name { get; set; }

    [Required]
    [Column("gender")]
    public required string Gender { get; set; }

    public UserDto AsDto()
    {
        return new UserDto
        {
            Id = Id,
            ApiKey = ApiKey,
            ApiKeyLastUsed = ApiKeyLastUsed,
            Name = Name,
            Gender = Gender
        };
    }
}
