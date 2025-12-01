using System.ComponentModel;
using Hangfire;
using Hangfire.Storage;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Cron.Interfaces;

namespace TornTools.Cron.Schedulers;
public class ApiJobScheduler(
    ILogger<ApiJobScheduler> logger,
    IApiCallerResolver callerResolver,
    IDatabaseService databaseService
) : IApiJobScheduler
{
    private readonly ILogger<ApiJobScheduler> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IApiCallerResolver _callerResolver = callerResolver ?? throw new ArgumentNullException(nameof(callerResolver));
    private readonly IDatabaseService _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));

    public void RegisterRecurringJobs()
    {
        using var connection = JobStorage.Current.GetConnection();
        var recurringJobs = connection.GetRecurringJobs();
        foreach (var job in recurringJobs)
        {
            RecurringJob.RemoveIfExists(job.Id);
        }

        RecurringJob.AddOrUpdate(
            nameof(ItemUpdate),
            () => ItemUpdate(),
            "0 */3 * * *" // At minute 0 past every 3rd hour.
        );

        RecurringJob.AddOrUpdate(
            nameof(CheckUntouchedMarketItems),
            () => CheckUntouchedMarketItems(),
            "0 */1 * * *" // At minute 0 past every 1 hour.
        );

        RecurringJob.AddOrUpdate(
        nameof(UpdateForeignStock),
            () => UpdateForeignStock(),
            "0/10 * * * *" // At every 10th minute from 0 through 59.
        );
    }

    [DisplayName("Daily Item update")]
    public async Task ItemUpdate()
    {
        _logger.LogInformation($"Running Hangfire job {nameof(ItemUpdate)}");
        await _databaseService.CreateQueueItem(
            callType: ApiCallType.TornItems,
            endpointUrl: TornApiConstants.Items,
            stoppingToken: CancellationToken.None
        );
    }

    [DisplayName("Untouched item update")]
    public async Task CheckUntouchedMarketItems()
    {
        _logger.LogInformation($"Running Hangfire job {nameof(CheckUntouchedMarketItems)}");
        await _databaseService.PopulateMarketQueueItemsRemaining(stoppingToken: CancellationToken.None);
    }

    [DisplayName("Foreign stock update")]
    public async Task UpdateForeignStock()
    {
        _logger.LogInformation($"Running Hangfire job {nameof(UpdateForeignStock)}");

        var queueItem = new QueueItemDto
        {
            CallType = ApiCallType.YataForeignStock,
            EndpointUrl = YataApiConstants.ForeignStock
        };

        var success = false;
        try
        {
            var caller = _callerResolver.GetCaller(ApiCallType.YataForeignStock);
            success = await caller.CallAsync(
                queueItem,
                stoppingToken: CancellationToken.None
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception processing {QueueItem} {Id}. Marking for retry.", nameof(QueueItemDto), queueItem.Id);
        }
    }
}
