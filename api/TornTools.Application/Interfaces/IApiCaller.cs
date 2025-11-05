using TornTools.Core.DataTransferObjects;

namespace TornTools.Application.Interfaces;

public interface IApiCaller
{
    Task<bool> CallAsync(QueueItemDto item, CancellationToken ct);
}
