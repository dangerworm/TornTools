using Microsoft.Extensions.DependencyInjection;
using TornTools.Application.Callers;
using TornTools.Application.Handlers;
using TornTools.Application.Interfaces;
using TornTools.Application.Resolvers;
using TornTools.Application.Services;
using TornTools.Core.Constants;

namespace TornTools.Application;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDependencies(this IServiceCollection services)
    {
        services
            .AddHttpClient(TornApiConstants.ClientName)
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                AutomaticDecompression =
                    System.Net.DecompressionMethods.GZip |
                    System.Net.DecompressionMethods.Deflate |
                    System.Net.DecompressionMethods.Brotli
            });

        services.AddScoped<IApiCaller, TornApiCaller>();
        services.AddScoped<IApiCaller, YataApiCaller>();
        services.AddScoped<IApiCallerResolver, ApiCallerResolver>();

        services.AddScoped<IApiCallHandler, TornItemsApiCallHandler>();
        services.AddScoped<IApiCallHandler, TornMarketListingsApiCallHandler>();
        services.AddScoped<IApiCallHandler, YataStocksApiCallHandler>();
        services.AddScoped<IApiCallHandlerResolver, ApiCallHandlerResolver>();
        
        services.AddScoped<IDatabaseService, DatabaseService>();

        return services;
    }
}
