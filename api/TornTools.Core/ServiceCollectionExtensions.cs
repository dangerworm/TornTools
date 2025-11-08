using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TornTools.Core.Configurations;

namespace TornTools.Core;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<TornApiCallerConfiguration>(
            configuration.GetSection(nameof(TornApiCallerConfiguration)));

        services.AddSingleton(sp =>
            sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<TornApiCallerConfiguration>>().Value
        );

        services.Configure<Weav3rApiCallerConfiguration>(
            configuration.GetSection(nameof(Weav3rApiCallerConfiguration)));

        services.AddSingleton(sp =>
            sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<Weav3rApiCallerConfiguration>>().Value
        );
        return services;
    }
}
