using Hangfire;
using Hangfire.Storage;
using Microsoft.Extensions.Logging;
using System.ComponentModel;
using TornTools.Application.Handlers;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Cron.Interfaces;

namespace TornTools.Cron.Schedulers;

public class ApiJobScheduler(
    ILogger<ApiJobScheduler> logger,
    IApiCallerResolver callerResolver,
    IApiCallHandlerResolver callHandlerResolver,
    IDatabaseService databaseService
) : IApiJobScheduler
{
  private readonly ILogger<ApiJobScheduler> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
  private readonly IApiCallerResolver _callerResolver = callerResolver ?? throw new ArgumentNullException(nameof(callerResolver));
  private readonly IApiCallHandlerResolver _callHandlerResolver = callHandlerResolver ?? throw new ArgumentNullException(nameof(callHandlerResolver));
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
        nameof(CheckForExpiredKeys),
        () => CheckForExpiredKeys(),
        "0/30 * * * *"  // At minute 0 past every 30th minute from 0 through 59. This is
                        // intentionally offset from the other jobs to reduce chance of
                        // overlapping API calls.
    );

    /*
     * 
     */
    //RecurringJob.AddOrUpdate(
    //    nameof(CheckUntouchedMarketItems),
    //    () => CheckUntouchedMarketItems(),
    //    "0 */1 * * *" // At minute 0 past every 1 hour.
    //);

    RecurringJob.AddOrUpdate(
    nameof(UpdateForeignStock),
        () => UpdateForeignStock(),
        "0/10 * * * *" // At every 10th minute from 0 through 59.
    );
  }

  [DisplayName("Remove expired keys")]
  public async Task CheckForExpiredKeys()
  {
    _logger.LogInformation("Running Hangfire job {JobName}", nameof(CheckForExpiredKeys));

    var caller = _callerResolver.GetCaller(ApiCallType.TornKeyInfo);
    var callHandler = _callHandlerResolver.GetHandler(ApiCallType.TornKeyInfo);

    var users = await _databaseService.GetUsersAsync(CancellationToken.None);
    foreach (var user in users)
    {
      if (user.Id is null)
      {
        _logger.LogWarning("User {Username} has no ID. Skipping API key check.", user.Name);
        continue;
      }

      if (string.IsNullOrEmpty(user.ApiKey))
      {
        _logger.LogWarning("User {Username} has no API key. Marking as unavailable.", user.Name);
        await _databaseService.MarkKeyUnavailableAsync(user.Id.Value, CancellationToken.None);
        continue;
      }

      var item = new QueueItemDto
      {
        CallType = ApiCallType.TornKeyInfo,
        EndpointUrl = TornApiConstants.KeyInfo,
        HeadersJson = new Dictionary<string, string> { ["Authorization"] = $"ApiKey {user.ApiKey}" },
        PayloadJson = new Dictionary<string, string> { ["UserId"] = user.Id.Value.ToString() }
      };

      await caller.CallAsync(item, callHandler, CancellationToken.None);
    }
  }

  [DisplayName("Items update")]
  public async Task ItemUpdate()
  {
    _logger.LogInformation("Running Hangfire job {JobName}", nameof(ItemUpdate));
    await _databaseService.CreateQueueItem(
        callType: ApiCallType.TornItems,
        endpointUrl: TornApiConstants.Items,
        stoppingToken: CancellationToken.None
    );
  }

  [DisplayName("Untouched item update")]
  public async Task CheckUntouchedMarketItems()
  {
    _logger.LogInformation("Running Hangfire job {JobName}", nameof(CheckUntouchedMarketItems));
    await _databaseService.PopulateMarketQueueItemsRemaining(stoppingToken: CancellationToken.None);
  }

  [DisplayName("Foreign stock update")]
  public async Task UpdateForeignStock()
  {
    _logger.LogInformation("Running Hangfire job {JobName}", nameof(UpdateForeignStock));

    var queueItem = new QueueItemDto
    {
      CallType = ApiCallType.YataForeignStock,
      EndpointUrl = YataApiConstants.ForeignStock
    };

    var success = false;
    try
    {
      var caller = _callerResolver.GetCaller(ApiCallType.YataForeignStock);
      var callHandler = _callHandlerResolver.GetHandler(ApiCallType.YataForeignStock);

      if (callHandler is not YataStocksApiCallHandler yataHandler)
      {
        _logger.LogError(
            "Expected handler for {CallType} to be of type {ExpectedType}, but got {ActualType}. Aborting job.",
            ApiCallType.YataForeignStock,
            typeof(YataStocksApiCallHandler).Name,
            callHandler.GetType().Name
        );
        return;
      }

      success = await caller.CallAsync(
          queueItem,
          yataHandler,
          stoppingToken: CancellationToken.None
      );
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Unhandled exception processing {QueueItem} {Id}. Marking for retry.", nameof(QueueItemDto), queueItem.Id);
    }

    if (!success)
    {
      _logger.LogWarning("Hangfire job {JobName} did not complete successfully.", nameof(UpdateForeignStock));
    }
  }
}
