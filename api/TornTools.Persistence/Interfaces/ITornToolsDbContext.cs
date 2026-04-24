using Microsoft.EntityFrameworkCore;
using TornTools.Persistence.Entities;

namespace TornTools.Persistence.Interfaces;

public interface ITornToolsDbContext
{
  DbSet<ForeignStockItemEntity> ForeignStockItems { get; set; }
  DbSet<ItemChangeLogEntity> ItemChangeLogs { get; set; }
  DbSet<ItemChangeLogSummaryEntity> ItemChangeLogSummaries { get; set; }
  DbSet<ItemEntity> Items { get; set; }
  DbSet<ListingEntity> Listings { get; set; }
  DbSet<ProfitableListingView> ProfitableListings { get; set; }
  DbSet<QueueItemEntity> QueueItems { get; set; }
  DbSet<UserFavouriteItemEntity> UserFavourites { get; set; }
  DbSet<UserEntity> Users { get; set; }
}