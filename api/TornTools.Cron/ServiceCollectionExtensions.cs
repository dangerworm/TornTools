using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Hangfire;
using Hangfire.PostgreSql;

namespace TornTools.Cron;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddHangfire(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHangfire(config =>
        {
            config
             .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
             .UseSimpleAssemblyNameTypeSerializer()
             .UseRecommendedSerializerSettings()
             .UsePostgreSqlStorage(bootstrapperOptions =>
             {
                 bootstrapperOptions.UseNpgsqlConnection(configuration.GetConnectionString("AzurePostgres"));
             },
             new PostgreSqlStorageOptions
             {
                 SchemaName = "hangfire",
                 PrepareSchemaIfNecessary = true
             });
        });

        services.AddHangfireServer();
        return services;
    }
}
