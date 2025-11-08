using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;

public interface IApiCallHandler
{
    CallType CallType { get; }
    Task HandleResponseAsync(string content, CancellationToken stoppingToken);
}