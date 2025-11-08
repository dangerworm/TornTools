using TornTools.Application.Interfaces;
using TornTools.Core.Enums;

namespace TornTools.Application.Handlers;

public class ApiCallHandlerResolver(
    IEnumerable<IApiCallHandler> handlers
) : IApiCallHandlerResolver
{
    private readonly Dictionary<CallType, IApiCallHandler> _handlers = handlers.ToDictionary(
            h => h.CallType,
            h => h);

    public IApiCallHandler GetHandler(CallType callType)
    {
        if (!_handlers.TryGetValue(callType, out var handler))
        {
            throw new KeyNotFoundException($"No API call handler registered for call type '{callType}'.");
        }

        return handler;
    }

    public bool TryGetHandler(CallType callType, out IApiCallHandler? handler)
        => _handlers.TryGetValue(callType, out handler);
}
