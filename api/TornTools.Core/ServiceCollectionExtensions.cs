using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TornTools.Core.Configurations;

namespace TornTools.Core;

public static class ServiceCollectionExtensions
{
  public static IServiceCollection AddConfigurations(this IServiceCollection services, IConfiguration configuration)
  {
    return services
        .AddLocalConfiguration(configuration)
        .AddJwtConfiguration(configuration)
        .AddTornApiCallerConfiguration(configuration)
        .AddTornKeyEncryptionConfiguration(configuration)
        .AddWeav3rApiCallerConfiguration(configuration)
        .AddTornMarketsProcessorConfiguration(configuration)
        .AddWeav3rBazaarsProcessorConfiguration(configuration)
        .AddBargainAlertsConfiguration(configuration);
  }

  private static IServiceCollection AddBargainAlertsConfiguration(this IServiceCollection services, IConfiguration configuration)
  {
    services.Configure<BargainAlertsConfiguration>(
        configuration.GetSection(nameof(BargainAlertsConfiguration)));

    services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<BargainAlertsConfiguration>>().Value
    );

    return services;
  }

  private static IServiceCollection AddLocalConfiguration(this IServiceCollection services, IConfiguration configuration)
  {
    services.Configure<EnvironmentConfiguration>(
        configuration.GetRequiredSection(nameof(EnvironmentConfiguration)));
    services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<EnvironmentConfiguration>>().Value
    );

    return services;
  }

  private static IServiceCollection AddJwtConfiguration(this IServiceCollection services, IConfiguration configuration)
  {
    services.Configure<JwtConfiguration>(
        configuration.GetRequiredSection(nameof(JwtConfiguration)));

    services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<JwtConfiguration>>().Value
    );

    return services;
  }

  private static IServiceCollection AddTornApiCallerConfiguration(this IServiceCollection services, IConfiguration configuration)
  {
    services.Configure<TornApiCallerConfiguration>(
        configuration.GetSection(nameof(TornApiCallerConfiguration)));

    services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<TornApiCallerConfiguration>>().Value
    );

    return services;
  }

  private static IServiceCollection AddTornKeyEncryptionConfiguration(this IServiceCollection services, IConfiguration configuration)
  {
    // Section name matches the TornKeyEncryption__* app_settings keys (shorter
    // than the class name for ergonomics in Terraform / env vars). Use GetSection
    // (not GetRequiredSection) so dev without user-secrets boots — the protector
    // throws with a clear error on first use when Keys is empty.
    services.Configure<TornKeyEncryptionConfiguration>(
        configuration.GetSection("TornKeyEncryption"));

    services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<TornKeyEncryptionConfiguration>>().Value
    );

    return services;
  }

  private static IServiceCollection AddWeav3rApiCallerConfiguration(this IServiceCollection services, IConfiguration configuration)
  {
    services.Configure<Weav3rApiCallerConfiguration>(
        configuration.GetSection(nameof(Weav3rApiCallerConfiguration)));

    services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<Weav3rApiCallerConfiguration>>().Value
    );

    return services;
  }

  private static IServiceCollection AddTornMarketsProcessorConfiguration(this IServiceCollection services, IConfiguration configuration)
  {
    services.Configure<TornMarketsProcessorConfiguration>(
        configuration.GetSection(nameof(TornMarketsProcessorConfiguration)));

    services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<TornMarketsProcessorConfiguration>>().Value
    );

    return services;
  }

  private static IServiceCollection AddWeav3rBazaarsProcessorConfiguration(this IServiceCollection services, IConfiguration configuration)
  {
    services.Configure<Weav3rBazaarsProcessorConfiguration>(
        configuration.GetSection(nameof(Weav3rBazaarsProcessorConfiguration)));

    services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<Weav3rBazaarsProcessorConfiguration>>().Value
    );

    return services;
  }
}
