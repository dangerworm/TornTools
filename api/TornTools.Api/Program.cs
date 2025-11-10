using Hangfire;
using TornTools.Application;
using TornTools.Application.Interfaces;
using TornTools.Application.Playwright;
using TornTools.Core;
using TornTools.Core.Constants;
using TornTools.Core.Enums;
using TornTools.Cron;
using TornTools.Cron.Interfaces;
using TornTools.Cron.Processors;
using TornTools.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSingleton<PlaywrightSingleton>();

builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddHangfire(builder.Configuration);
builder.Services.AddHostedService<QueueProcessor>();
builder.Services.AddHttpClient();
builder.Services.AddConfiguration(builder.Configuration);
builder.Services.AddDependencies();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseHangfireDashboard("/hangfire");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using (var scope = app.Services.CreateScope())
{
    var databaseService = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
    var numberOfItems = await databaseService.GetNumberOfItemsAsync(CancellationToken.None);

    if (numberOfItems == 0)
    {
        await databaseService.CreateQueueItem(ApiCallType.TornItems, TornApiEndpointConstants.Items, CancellationToken.None);
    }

    var jobScheduler = scope.ServiceProvider.GetRequiredService<IApiJobScheduler>();
    jobScheduler.RegisterRecurringJobs();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

await app.RunAsync();
