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
        .AddWeav3rApiCallerConfiguration(configuration);
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

  private static IServiceCollection AddWeav3rApiCallerConfiguration(this IServiceCollection services, IConfiguration configuration)
  {
    services.Configure<Weav3rApiCallerConfiguration>(
        configuration.GetSection(nameof(Weav3rApiCallerConfiguration)));

    services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<Weav3rApiCallerConfiguration>>().Value
    );

    return services;
  }
}
