using Microsoft.EntityFrameworkCore;
using TornTools.Persistence.Entities;

namespace TornTools.Persistence.Interfaces;
public interface ITornToolsDbContext
{
    DbSet<ItemChangeLogEntity> ItemChangeLogs { get; set; }
    DbSet<ItemEntity> Items { get; set; }
    DbSet<ListingEntity> Listings { get; set; }
    DbSet<QueueItemEntity> QueueItems { get; set; }
}