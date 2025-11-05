using Microsoft.EntityFrameworkCore;
using TornTools.Persistence.Entities;

namespace TornTools.Persistence.Interfaces;
public interface ITornToolsDbContext
{
    DbSet<ItemEntity> Items { get; set; }
    DbSet<ListingEntity> Listings { get; set; }
    DbSet<PlayerEntity> Players { get; set; }
    DbSet<QueueItemEntity> QueueItems { get; set; }
}