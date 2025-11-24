using Microsoft.EntityFrameworkCore;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence;

public class TornToolsDbContext(
    DbContextOptions<TornToolsDbContext> options
) : DbContext(options), ITornToolsDbContext
{
    public DbSet<ItemChangeLogEntity> ItemChangeLogs { get; set; } = null!;
    public DbSet<ItemEntity> Items { get; set; } = null!;
    public DbSet<ListingEntity> Listings { get; set; } = null!;
    public DbSet<ProfitableListingView> ProfitableListings { get; set; } = null!;
    public DbSet<QueueItemEntity> QueueItems { get; set; } = null!;
    public DbSet<UserEntity> Users { get; set; } = null!;
    public DbSet<UserFavouriteItemEntity> UserFavourites { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Entity mapping

        modelBuilder.Entity<ItemChangeLogEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ItemId).IsRequired();
            e.Property(x => x.Source).IsRequired();
            e.Property(x => x.ChangeTime).IsRequired();
            e.Property(x => x.NewPrice).IsRequired();

            e.HasOne<ItemEntity>()
                .WithMany()
                .HasForeignKey(x => x.ItemId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ItemEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.IsMasked).IsRequired();
            e.Property(x => x.IsTradable).IsRequired();
            e.Property(x => x.IsFoundInCity).IsRequired();
        });

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

            e.HasMany(u => u.FavouriteItems)
                .WithOne(uf => uf.User)
                .HasForeignKey(uf => uf.UserId)
                .OnDelete(DeleteBehavior.Cascade);
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
        });

        // View mapping

        modelBuilder.Entity<ProfitableListingView>(e =>
        {
            e.HasNoKey();
            e.ToView("profitable_listings", "public");
        });
    }
}