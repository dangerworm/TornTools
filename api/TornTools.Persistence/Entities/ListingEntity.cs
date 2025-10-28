using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TornTools.Persistence.Entities;

[Table("listings", Schema = "public")]

public class ListingEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid(); // matches DEFAULT gen_random_uuid()

    [Required]
    [Column("correlation_id")]
    public Guid CorrelationId { get; set; }

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

    [Column("price")]
    public long? Price { get; set; }

    [Column("quantity")]
    public int? Quantity { get; set; }
}