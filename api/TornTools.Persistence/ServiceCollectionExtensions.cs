using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TornTools.Persistence.Interfaces;
using TornTools.Persistence.Repositories;

namespace TornTools.Persistence;
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ITornToolsDbContext, TornToolsDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("AzurePostgres")));

        services.AddScoped<IItemChangeLogRepository, ItemChangeLogRepository>();
        services.AddScoped<IItemRepository, ItemRepository>();
        services.AddScoped<IListingRepository, ListingRepository>();
        services.AddScoped<IQueueItemRepository, QueueItemRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        return services;
    }
}
