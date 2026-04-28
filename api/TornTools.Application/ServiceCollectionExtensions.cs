using Microsoft.Extensions.DependencyInjection;
using TornTools.Application.Callers;
using TornTools.Application.Handlers;
using TornTools.Application.Interfaces;
using TornTools.Application.Resolvers;
using TornTools.Application.Services;
using TornTools.Core.Constants;
using TornTools.Core.Interfaces;

namespace TornTools.Application;

public static class ServiceCollectionExtensions
{
  public static IServiceCollection AddDependencies(this IServiceCollection services)
  {
    // Per-request timeout so a stalled upstream can't tie a queue worker up
    // for the HttpClient default of 100 s — we'd rather fail fast and retry.
    var apiCallTimeout = TimeSpan.FromSeconds(30);

    services
        .AddHttpClient(TornApiConstants.ClientName, client => client.Timeout = apiCallTimeout)
        .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
          AutomaticDecompression =
                System.Net.DecompressionMethods.GZip |
                System.Net.DecompressionMethods.Deflate |
                System.Net.DecompressionMethods.Brotli
        });

    services
        .AddHttpClient(YataApiConstants.ClientName, client => client.Timeout = apiCallTimeout)
        .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
          AutomaticDecompression =
                System.Net.DecompressionMethods.GZip |
                System.Net.DecompressionMethods.Deflate |
                System.Net.DecompressionMethods.Brotli
        });

    services.AddScoped<IApiCaller, TornApiMultiKeyCaller>();
    services.AddScoped<IApiCaller, Weav3rApiCaller>();
    services.AddScoped<IApiCaller, YataApiCaller>();
    services.AddScoped<IApiCallerResolver, ApiCallerResolver>();

    services.AddScoped<IApiCallHandler, TornItemsApiCallHandler>();
    services.AddScoped<IApiCallHandler, TornMarketListingsApiCallHandler>();
    services.AddScoped<IApiCallHandler, Weav3rBazaarListingsApiCallHandler>();
    services.AddScoped<IApiCallHandler, YataStocksApiCallHandler>();
    services.AddScoped<IApiCallHandlerResolver, ApiCallHandlerResolver>();

    services.AddScoped<IDatabaseService, DatabaseService>();
    services.AddScoped<IBargainAlertService, BargainAlertService>();
    services.AddSingleton<IBargainAlertAuthService, BargainAlertAuthService>();

    services.AddSingleton<IApiKeyProtector, ApiKeyProtector>();

    services.AddSingleton<Weav3rPythonServer>();

    return services;
  }
}
