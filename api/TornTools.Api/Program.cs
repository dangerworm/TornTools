using Hangfire;
using TornTools.Api;
using TornTools.Api.Validation;
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

builder.Services.AddCorsPolicy();
builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddHangfire(builder.Configuration);
builder.Services.AddHttpClient();
builder.Services.AddConfiguration(builder.Configuration);
builder.Services.AddDependencies();

builder.Services.AddControllers();
builder.Services.AddValidatorsFromAssemblyContaining<UserDetailsInputModelValidator>();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value!.Errors.Select(error => error.ErrorMessage).ToArray());

        return new BadRequestObjectResult(new
        {
            message = "Validation failed.",
            errors
        });
    };
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var localConfig = builder.Configuration.GetSection(nameof(LocalConfiguration)).Get<LocalConfiguration>();
if (localConfig is null || !localConfig.RunningLocally)
{
    builder.Services.AddHostedService<QueueProcessor>();
}

var app = builder.Build();

app.UseHangfireDashboard("/hangfire");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using var scope = app.Services.CreateScope();
if (localConfig is null || !localConfig.RunningLocally)
{
    var databaseService = scope.ServiceProvider.GetRequiredService<IDatabaseService>();

    await databaseService.RemoveQueueItemsAsync(CancellationToken.None);

    var numberOfItems = await databaseService.GetNumberOfItemsAsync(CancellationToken.None);
    if (numberOfItems == 0)
    {
        await databaseService.CreateQueueItem(ApiCallType.TornItems, TornApiConstants.Items, CancellationToken.None);
    }
}

var jobScheduler = scope.ServiceProvider.GetRequiredService<IApiJobScheduler>();
jobScheduler.RegisterRecurringJobs();

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors(ApiConstants.CorsPolicy);

app.UseAuthorization();

app.MapControllers();

await app.RunAsync();
