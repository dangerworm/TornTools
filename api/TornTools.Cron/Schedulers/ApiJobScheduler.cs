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
            nameof(DailyItemUpdate),
            () => DailyItemUpdate(),
            "0 2 * * *" // At 02:00.
        );

        RecurringJob.AddOrUpdate(
            nameof(UpdateNonResaleItems),
            () => UpdateNonResaleItems(),
            "0 */3 * * *" // At minute 0 past every 3rd hour.
        );

        RecurringJob.AddOrUpdate(
            nameof(Run20MinJob),
            () => Run20MinJob(),
            "0/20 * * * *" // At every 20th minute from 0 through 59.
        );
    }

    [DisplayName("Daily Item Update")]
    public async Task DailyItemUpdate()
    {
        _logger.LogInformation($"Running {nameof(DailyItemUpdate)}");
        await _databaseService.CreateQueueItem(
            callType: Core.Enums.ApiCallType.TornItems,
            endpointUrl: TornApiConstants.Items,
            stoppingToken: CancellationToken.None
        );
    }

    [DisplayName("Non-resale item update")]
    public async Task UpdateNonResaleItems()
    {
        _logger.LogInformation($"Running {nameof(UpdateNonResaleItems)}");
    }

    [DisplayName("20-Minute API Call")]
    public async Task Run20MinJob()
    {
        _logger.LogInformation("Running 20-minute API job...");
    }
}
