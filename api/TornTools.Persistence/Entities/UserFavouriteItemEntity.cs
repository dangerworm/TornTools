using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Entities;

[Table("user_favourite_items", Schema = "public")]
public class UserFavouriteItemEntity
{
    [Required]
    [Column("user_id")]
    public required long UserId { get; set; }

    [Required]
    [Column("item_id")]
    public required int ItemId { get; set; }

    public UserFavouriteItemDto AsDto()
    {
        return new UserFavouriteItemDto
        {
            UserId = UserId,
            ItemId = ItemId
        };
    }
}
