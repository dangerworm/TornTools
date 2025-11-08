using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Enums;

namespace TornTools.Application.Handlers;
public abstract class ApiCallHandler(
    ILogger<ApiCallHandler> logger,
    IDatabaseService databaseService
) : IApiCallHandler
{
    protected readonly ILogger<ApiCallHandler> Logger = logger ?? throw new ArgumentNullException(nameof(logger));
    protected readonly IDatabaseService DatabaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));

    public abstract CallType CallType { get; }

    public abstract Task HandleResponseAsync(string content, CancellationToken stoppingToken);
}
