using Hangfire;
using TornTools.Api;
using TornTools.Application;
using TornTools.Application.Interfaces;
using TornTools.Core;
using TornTools.Core.Configurations;
using TornTools.Core.Constants;
using TornTools.Core.Enums;
using TornTools.Cron;
using TornTools.Cron.Interfaces;
using TornTools.Cron.Processors;
using TornTools.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCorsPolicy(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddHangfire(builder.Configuration);
builder.Services.AddHttpClient();
builder.Services.AddConfigurations(builder.Configuration);
builder.Services.AddDependencies();

builder.Services.AddControllers();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var environmentConfiguration = builder.Configuration
  .GetRequiredSection(nameof(EnvironmentConfiguration)).Get<EnvironmentConfiguration>()
    ?? throw new InvalidProgramException($"Failed to bind {nameof(EnvironmentConfiguration)} from configuration.");

if (environmentConfiguration.RunQueueProcessor)
{
  builder.Services.AddHostedService<QueueProcessor>();
}

var app = builder.Build();

var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();

app.UseHangfireDashboard("/hangfire");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
  app.MapOpenApi();
}

using var scope = app.Services.CreateScope();
if (environmentConfiguration.PopulateQueue)
{
  startupLogger.LogInformation("Running in hosted mode. Initialising queue.");

  var databaseService = scope.ServiceProvider.GetRequiredService<IDatabaseService>();

  await databaseService.RemoveQueueItemsAsync(CancellationToken.None);

  var numberOfItems = await databaseService.GetNumberOfItemsAsync(CancellationToken.None);
  if (numberOfItems == 0)
  {
    startupLogger.LogInformation("No items found in database. Creating initial queue item.");
    await databaseService.CreateQueueItem(ApiCallType.TornItems, TornApiConstants.Items, CancellationToken.None);
  }
  else
  {
    startupLogger.LogInformation("Database contains {ItemCount} items.", numberOfItems);
  }
}
else
{
  startupLogger.LogInformation("Running locally. Skipping queue initialisation and background processor.");
}

var jobScheduler = scope.ServiceProvider.GetRequiredService<IApiJobScheduler>();
jobScheduler.RegisterRecurringJobs();
startupLogger.LogInformation("Recurring Hangfire jobs registered.");

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors(ApiConstants.CorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await app.RunAsync();
