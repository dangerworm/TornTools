using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Hangfire;
using Hangfire.PostgreSql;
using TornTools.Cron.Interfaces;
using TornTools.Cron.Schedulers;
using TornTools.Core.Constants;
using TornTools.Core.Configurations;
using TornTools.Cron.Processors;

namespace TornTools.Cron;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddHangfire(this IServiceCollection services, IConfiguration configuration)
    {
        var localConfig = configuration.GetSection(nameof(LocalConfiguration)).Get<LocalConfiguration>();
        var isLocal = localConfig is not null && localConfig.RunningLocally;

        services.AddHangfire(config =>
        {
            config
             .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
             .UseSimpleAssemblyNameTypeSerializer()
             .UseRecommendedSerializerSettings()
             .UsePostgreSqlStorage(bootstrapperOptions =>
             {
                 bootstrapperOptions.UseNpgsqlConnection(configuration.GetConnectionString(DatabaseConstants.ConnectionString));
             },
             new PostgreSqlStorageOptions
             {
                 SchemaName = isLocal ? "hangfire_local" : "hangfire",
                 PrepareSchemaIfNecessary = true
             });
        });

        services.AddHangfireServer();

        services.AddScoped<IApiJobScheduler, ApiJobScheduler>();

        return services;
    }
}
