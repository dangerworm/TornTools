using Microsoft.Extensions.DependencyInjection;
using TornTools.Application.Callers;
using TornTools.Application.Handlers;
using TornTools.Application.Interfaces;
using TornTools.Application.Services;

namespace TornTools.Application;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDependencies(this IServiceCollection services)
    {
        services.AddScoped<IApiCaller, TornApiCaller>();

        services.AddScoped<IApiCallHandler, TornItemsApiCallHandler>();
        services.AddScoped<IApiCallHandlerResolver, ApiCallHandlerResolver>();
        
        services.AddScoped<IDatabaseService, DatabaseService>();

        return services;
    }
}
