using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Application.Handlers;

public abstract class ListingApiCallHandler<TCallHandler>(
    ILogger<TCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler<TCallHandler>(logger, databaseService)
    where TCallHandler : IApiCallHandler
{
}
