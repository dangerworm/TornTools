using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Enums;

namespace TornTools.Application.Handlers;
public abstract class ApiCallHandler<TCallHandler>(
    ILogger<TCallHandler> logger,
    IDatabaseService databaseService
) : IApiCallHandler
    where TCallHandler : IApiCallHandler
{
    protected readonly ILogger<TCallHandler> Logger = logger ?? throw new ArgumentNullException(nameof(logger));
    protected readonly IDatabaseService DatabaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));

    public abstract ApiCallType CallType { get; }

    public abstract Task HandleResponseAsync(string content, CancellationToken stoppingToken);
}
