using Hangfire;
using TornTools.Application;
using TornTools.Application.Callers;
using TornTools.Application.Handlers;
using TornTools.Application.Interfaces;
using TornTools.Application.Services;
using TornTools.Core;
using TornTools.Core.Constants;
using TornTools.Cron;
using TornTools.Cron.Interfaces;
using TornTools.Cron.Processors;
using TornTools.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Explicitly specify the namespace to resolve ambiguity
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
    await databaseService.CreateQueueItem(nameof(TornApiCaller), TornApiEndpointConstants.Items, CancellationToken.None);

    var jobScheduler = scope.ServiceProvider.GetRequiredService<IApiJobScheduler>();
    jobScheduler.RegisterRecurringJobs();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

await app.RunAsync();
