using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;

public interface IApiCallHandler
{
    ApiCallType CallType { get; }
    Task HandleResponseAsync(string content, CancellationToken stoppingToken);
}