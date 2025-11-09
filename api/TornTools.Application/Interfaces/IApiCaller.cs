using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;

public interface IApiCaller
{
    IEnumerable<ApiCallType> CallTypes { get; }
    Task<bool> CallAsync(QueueItemDto item, CancellationToken ct);
}
