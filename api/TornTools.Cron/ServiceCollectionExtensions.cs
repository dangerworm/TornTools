using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TornTools.Core.Configurations;
using TornTools.Core.Constants;
using TornTools.Core.Enums;
using TornTools.Cron.Interfaces;
using TornTools.Cron.Schedulers;

namespace TornTools.Cron;

public static class ServiceCollectionExtensions
{
  public static IServiceCollection AddHangfire(this IServiceCollection services, IConfiguration configuration)
  {
    var localConfig = configuration.GetRequiredSection(nameof(EnvironmentConfiguration)).Get<EnvironmentConfiguration>()
      ?? throw new InvalidProgramException($"Failed to bind {nameof(EnvironmentConfiguration)} from configuration.");

    var isLocal = localConfig.EnvironmentName.Equals(TerraformEnvironmentName.Development);

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
