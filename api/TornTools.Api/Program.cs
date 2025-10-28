using Hangfire;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.


builder.Services.AddScoped<IApiCallHandler, ApiCallHandler>();

builder.Services.AddHostedService<QueueProcessorService>();

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
    var jobScheduler = scope.ServiceProvider.GetRequiredService<IApiJobScheduler>();
    jobScheduler.RegisterRecurringJobs();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();


await app.RunAsync();
