using System.ComponentModel;
using Hangfire;
using Microsoft.Extensions.Logging;
using TornTools.Application.DataTransferObjects;
using TornTools.Application.Interfaces;
using TornTools.Cron.Interfaces;

namespace TornTools.Cron.Schedulers;
public class ApiJobScheduler : IApiJobScheduler
{
    private readonly ILogger<ApiJobScheduler> _logger;
    private readonly IApiCallHandler _handler;

    public ApiJobScheduler(ILogger<ApiJobScheduler> logger, IApiCallHandler handler)
    {
        _logger = logger;
        _handler = handler;
    }

    public void RegisterRecurringJobs()
    {
        RecurringJob.AddOrUpdate(
            "CallHourlyEndpoint",
            () => RunHourlyJob(),
            "0 6 * * *" // At 06:00.
        );

        RecurringJob.AddOrUpdate(
            "Call15MinuteEndpoint",
            () => Run20MinJob(),
            "0/20 * * * *" // At every 20th minute from 0 through 59.
        );
    }

    [DisplayName("Hourly API Call")]
    public async Task RunHourlyJob()
    {
        _logger.LogInformation("Running hourly API job...");
        await _handler.ProcessAsync(new QueueItemDto
        {
            EndpointUrl = "https://api.example.com/hourly",
            HttpMethod = "GET"
        }, CancellationToken.None);
    }

    [DisplayName("20-Minute API Call")]
    public async Task Run20MinJob()
    {
        _logger.LogInformation("Running 20-minute API job...");
        await _handler.ProcessAsync(new QueueItemDto
        {
            EndpointUrl = "https://api.example.com/15min",
            HttpMethod = "POST",
            PayloadJson = "{\"example\":true}"
        }, CancellationToken.None);
    }
}
