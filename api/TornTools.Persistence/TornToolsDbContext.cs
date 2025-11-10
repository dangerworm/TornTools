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
    public DbSet<QueueItemEntity> QueueItems { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ItemChangeLogEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ItemId).IsRequired();
            e.Property(x => x.Source).IsRequired();
            e.Property(x => x.ChangeTime).IsRequired();
            e.Property(x => x.NewPrice).IsRequired();
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
    }

}