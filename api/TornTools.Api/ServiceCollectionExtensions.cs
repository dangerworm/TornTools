using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TornTools.Api.Authentication;
using TornTools.Core.Configurations;
using TornTools.Core.Constants;

namespace TornTools.Api;

public static class ServiceCollectionExtensions
{
  public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
  {
    var origins = new List<string>
    {
      "http://localhost:5173",
      "https://localhost:7012"
    };

    var frontendUrl = configuration["CorsAllowedOrigins"];
    if (!string.IsNullOrWhiteSpace(frontendUrl))
    {
      origins.Add(frontendUrl);
    }

    services.AddCors(options =>
    {
      options.AddPolicy(ApiConstants.CorsPolicy, policy =>
      {
        policy
          .WithOrigins([.. origins])
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials();
      });
    });

    return services;
  }

  public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
  {
    var jwtConfig = configuration.GetRequiredSection(nameof(JwtConfiguration)).Get<JwtConfiguration>()
        ?? throw new InvalidProgramException($"Failed to bind {nameof(JwtConfiguration)} from configuration.");

    services.AddSingleton<JwtService>();

    services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
          options.TokenValidationParameters = new TokenValidationParameters
          {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig.Secret)),
            ValidateIssuer = true,
            ValidIssuer = jwtConfig.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtConfig.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
          };

          options.Events = new JwtBearerEvents
          {
            OnMessageReceived = ctx =>
            {
              ctx.Token = ctx.Request.Cookies["auth"];
              return Task.CompletedTask;
            }
          };
        });

    services.AddAuthorization();

    return services;
  }
}
