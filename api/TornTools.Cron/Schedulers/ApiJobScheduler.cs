using System.ComponentModel;
using Hangfire;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Cron.Interfaces;

namespace TornTools.Cron.Schedulers;
public class ApiJobScheduler(ILogger<ApiJobScheduler> logger, IApiCaller handler) : IApiJobScheduler
{
    private readonly ILogger<ApiJobScheduler> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IApiCaller _handler = handler ?? throw new ArgumentNullException(nameof(handler));

    public void RegisterRecurringJobs()
    {
        RecurringJob.AddOrUpdate(
            "CallDailyEndpoint",
            () => RunDailyJob(),
            "0 0 * * *" // At 00:00.
        );

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

    [DisplayName("Daily Item Update")]
    public async Task RunDailyJob()
    {
        _logger.LogInformation("Running daily item update...");
        await _handler.CallAsync(new QueueItemDto
        {
            CallType = "DailyItemUpdate",
            EndpointUrl = "https://api.example.com/hourly",
            HttpMethod = "GET"
        }, CancellationToken.None);
    }

    [DisplayName("Hourly API Call")]
    public async Task RunHourlyJob()
    {
        _logger.LogInformation("Running hourly API job...");
        await _handler.CallAsync(new QueueItemDto
        {
            CallType = "HourlyApiCall",
            EndpointUrl = "https://api.example.com/hourly",
            HttpMethod = "GET"
        }, CancellationToken.None);
    }

    [DisplayName("20-Minute API Call")]
    public async Task Run20MinJob()
    {
        _logger.LogInformation("Running 20-minute API job...");
        await _handler.CallAsync(new QueueItemDto
        {
            CallType = "20MinApiCall",
            EndpointUrl = "https://api.example.com/15min",
            HttpMethod = "POST",
            PayloadJson = new Dictionary<string, string> { { "example", "true" } }
        }, CancellationToken.None);
    }
}
