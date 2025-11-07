namespace TornTools.Application.Interfaces;

public interface IApiCallHandler
{
    string CallHandler { get; }
    Task HandleResponseAsync(HttpResponseMessage response, CancellationToken stoppingToken);
}