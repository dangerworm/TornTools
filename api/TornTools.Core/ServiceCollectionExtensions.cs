using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TornTools.Core.Configurations;

namespace TornTools.Core;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        // Bind the whole section to TornApiCallerConfiguration
        services.Configure<TornApiCallerConfiguration>(
            configuration.GetSection(nameof(TornApiCallerConfiguration)));

        // If you *really* want the POCO directly injectable (not just IOptions<T>):
        services.AddSingleton(sp =>
            sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<TornApiCallerConfiguration>>().Value
        );

        return services;
    }
}
