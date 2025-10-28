using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence;
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ITornToolsDbContext, TornToolsDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("AzurePostgres")));

        return services;
    }
}
