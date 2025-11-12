namespace TornTools.Api;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAuthentication(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("FrontendOnly", policy =>
            {
                policy
                    .WithOrigins(
                        "https://localhost",
                        "https://dangerworm.github.io/TornTools/"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }
}
