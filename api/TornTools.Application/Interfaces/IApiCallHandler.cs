using TornTools.Application.DataTransferObjects;

namespace TornTools.Application.Interfaces;

public interface IApiCallHandler
{
    Task<bool> ProcessAsync(QueueItemDto item, CancellationToken ct);
}
