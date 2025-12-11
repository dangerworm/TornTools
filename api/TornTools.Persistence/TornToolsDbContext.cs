using Microsoft.EntityFrameworkCore;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence;

public class TornToolsDbContext(
    DbContextOptions<TornToolsDbContext> options
) : DbContext(options), ITornToolsDbContext
{
    public DbSet<ForeignStockItemEntity> ForeignStockItems { get; set; } = null!;
    public DbSet<ItemChangeLogEntity> ItemChangeLogs { get; set; } = null!;
    public DbSet<ItemEntity> Items { get; set; } = null!;
    public DbSet<ListingEntity> Listings { get; set; } = null!;
    public DbSet<ProfitableListingView> ProfitableListings { get; set; } = null!;
    public DbSet<QueueItemEntity> QueueItems { get; set; } = null!;
    public DbSet<UserEntity> Users { get; set; } = null!;
    public DbSet<UserFavouriteItemEntity> UserFavourites { get; set; } = null!;
    public DbSet<ThemeEntity> Themes { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Entity mapping

        modelBuilder.Entity<ForeignStockItemEntity>(e =>
        {
            e.HasKey(x => new { x.ItemId, x.Country });
            e.Property(x => x.ItemId).IsRequired();
            e.Property(x => x.Country).IsRequired();
            e.Property(x => x.ItemName).IsRequired();
            e.Property(x => x.Quantity).IsRequired();
            e.Property(x => x.Cost).IsRequired();
            e.Property(x => x.LastUpdated).IsRequired();
            
            e.HasOne(fsi => fsi.Item)
                .WithMany(i => i.ForeignStockItems)
                .HasForeignKey(fsi => fsi.ItemId)
                .HasPrincipalKey(i => i.Id);
        });

        modelBuilder.Entity<ItemChangeLogEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ItemId).IsRequired();
            e.Property(x => x.Source).IsRequired();
            e.Property(x => x.ChangeTime).IsRequired();
            e.Property(x => x.NewPrice).IsRequired();

            e.HasOne<ItemEntity>()
                .WithMany(i => i.ChangeLogs)
                .HasForeignKey(icl => icl.ItemId)
                .HasPrincipalKey(i => i.Id);
        });

        modelBuilder.Entity<ItemEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.IsMasked).IsRequired();
            e.Property(x => x.IsTradable).IsRequired();
            e.Property(x => x.IsFoundInCity).IsRequired();
            e.Property(x => x.LastUpdated).IsRequired();
        });

        modelBuilder.Entity<ItemMarketHistoryPointEntity>().HasNoKey();

        modelBuilder.Entity<ListingEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.CorrelationId).IsRequired();
            e.Property(x => x.ItemId).IsRequired();
            e.Property(x => x.ListingPosition).IsRequired();
            e.Property(x => x.TimeSeen).IsRequired();

            e.HasOne<ItemEntity>()
                .WithMany()
                .HasForeignKey(x => x.ItemId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QueueItemEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.ItemStatus, x.NextAttemptAt, x.CreatedAt });

            e.Property(x => x.QueueIndex)
               .ValueGeneratedOnAdd() 
               .UseIdentityAlwaysColumn();
        });

        modelBuilder.Entity<UserEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ApiKey).IsRequired();
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.Gender).IsRequired();

            e.HasOne(u => u.PreferredTheme)
                .WithMany()
                .HasForeignKey(u => u.PreferredThemeId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<UserFavouriteItemEntity>(e =>
        {
            e.HasKey(x => new { x.UserId, x.ItemId });

            e.Property(x => x.UserId)
                .HasColumnName("user_id")
                .IsRequired();

            e.Property(x => x.ItemId)
                .HasColumnName("item_id")
                .IsRequired();

            e.HasOne(ufi => ufi.User)
                .WithMany(u => u.FavouriteItems)
                .HasForeignKey(ufi => ufi.UserId)
                .HasPrincipalKey(u => u.Id);
        });

        modelBuilder.Entity<ThemeEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.Mode).IsRequired();
            e.Property(x => x.PrimaryColor).IsRequired();
            e.Property(x => x.SecondaryColor).IsRequired();

            e.HasOne(t => t.User)
                .WithMany(u => u.CustomThemes)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // View mapping

        modelBuilder.Entity<ProfitableListingView>(e =>
        {
            e.HasNoKey();
            e.ToView("profitable_listings", "public");
        });
    }
}