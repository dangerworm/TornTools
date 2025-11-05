using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TornTools.Application.Interfaces;
using TornTools.Application.Services;

namespace TornTools.Application;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDependencies(this IServiceCollection services)
    {
        services.AddScoped<IApiCaller, ApiCaller>();
        services.AddScoped<IDatabaseService, DatabaseService>();
        return services;
    }
}
