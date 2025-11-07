using Microsoft.EntityFrameworkCore;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence;

public class TornToolsDbContext(
    DbContextOptions<TornToolsDbContext> options
) : DbContext(options), ITornToolsDbContext
{
    public DbSet<ItemEntity> Items { get; set; } = null!;
    public DbSet<ListingEntity> Listings { get; set; } = null!;
    public DbSet<PlayerEntity> Players { get; set; } = null!;
    public DbSet<QueueItemEntity> QueueItems { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ItemEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.IsMasked).IsRequired();
            e.Property(x => x.IsTradable).IsRequired();
            e.Property(x => x.IsFoundInCity).IsRequired();
        });

        modelBuilder.Entity<PlayerEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.Level).IsRequired();
            e.Property(x => x.Gender).IsRequired();
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

            e.HasOne<PlayerEntity>()
                .WithMany()
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<QueueItemEntity>(e =>
        {
            e.HasKey(x => x.Id);

            e.HasIndex(x => new { x.ItemStatus, x.NextAttemptAt, x.CreatedAt });
        });
    }

}