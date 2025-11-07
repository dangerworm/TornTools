using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Entities;

[Table("listings", Schema = "public")]
public class ListingEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public required string Source { get; set; }

    [Required]
    [Column("correlation_id")]
    public required Guid CorrelationId { get; set; }

    [Column("player_id")]
    public long? PlayerId { get; set; }

    [Required]
    [Column("item_id")]
    public int ItemId { get; set; }

    [Required]
    [Column("listing_position")]
    public int ListingPosition { get; set; }

    [Required]
    [Column("time_seen")]
    public DateTime TimeSeen { get; set; }

    [Required]
    [Column("price")]
    public long Price { get; set; }

    [Required]
    [Column("quantity")]
    public int Quantity { get; set; }

    public ListingDto AsDto()
    {
        return new ListingDto
        {
            Id = Id,
            Source = Source,
            CorrelationId = CorrelationId,
            PlayerId = PlayerId,
            ItemId = ItemId,
            ListingPosition = ListingPosition,
            TimeSeen = TimeSeen,
            Price = Price,
            Quantity = Quantity
        };
    }
}