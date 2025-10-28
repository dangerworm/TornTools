using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace TornTools.Persistence;
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<TornToolsDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("AzurePostgres")));

        return services;
    }
}
