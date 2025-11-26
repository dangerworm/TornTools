using System.ComponentModel;
using Hangfire;
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
        nameof(UpdateForeignStock),
            () => UpdateForeignStock(),
            "0/5 * * * *" // At every 5th minute from 0 through 59.
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

    [DisplayName("Foreign stock update")]
    public async Task UpdateForeignStock()
    {
        _logger.LogInformation($"Running {nameof(UpdateForeignStock)}...");
        
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
