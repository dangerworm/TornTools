using System.ComponentModel;
using Hangfire;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Cron.Interfaces;

namespace TornTools.Cron.Schedulers;
public class ApiJobScheduler(
    ILogger<ApiJobScheduler> logger, 
    IDatabaseService databaseService) : IApiJobScheduler
{
    private readonly ILogger<ApiJobScheduler> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IDatabaseService _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));

    public void RegisterRecurringJobs()
    {
        RecurringJob.AddOrUpdate(
            "CallDailyEndpoint",
            () => RunDailyJob(),
            "0 2 * * *" // At 02:00.
        );

        RecurringJob.AddOrUpdate(
            "CallHourlyEndpoint",
            () => RunHourlyJob(),
            "0 * * * *" // Every hour.
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
        _logger.LogInformation("Queueing daily item update...");
        await _databaseService.CreateQueueItem(
            callType: Core.Enums.ApiCallType.TornItems,
            endpointUrl: TornApiEndpointConstants.Items,
            stoppingToken: CancellationToken.None
        );
    }

    [DisplayName("Hourly API Call")]
    public async Task RunHourlyJob()
    {
        _logger.LogInformation("Running hourly API job...");
    }

    [DisplayName("20-Minute API Call")]
    public async Task Run20MinJob()
    {
        _logger.LogInformation("Running 20-minute API job...");
    }
}
