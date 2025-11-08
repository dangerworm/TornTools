using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Persistence.Entities;

[Table("item_change_logs", Schema = "public")]
public class ItemChangeLogEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("item_id")]
    public required int ItemId { get; set; }

    [Required]
    [Column("source")]
    public required string Source { get; set; }

    [Required]
    [Column("change_time")]
    public required DateTime ChangeTime { get; set; }

    [Required]
    [Column("new_price")]
    public required long NewPrice { get; set; }

    public ItemChangeLogDto AsDto()
    {
        return new ItemChangeLogDto
        {
            Id = Id,
            ItemId = ItemId,
            Source = Enum.Parse<Source>(Source),
            ChangeTime = ChangeTime,
            NewPrice = NewPrice
        };
    }
}
