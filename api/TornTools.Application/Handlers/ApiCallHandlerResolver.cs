using TornTools.Application.Interfaces;

namespace TornTools.Application.Handlers;

public class ApiCallHandlerResolver : IApiCallHandlerResolver
{
    private readonly IReadOnlyDictionary<string, IApiCallHandler> _handlers;

    public ApiCallHandlerResolver(IEnumerable<IApiCallHandler> handlers)
    {
        _handlers = handlers.ToDictionary(
            h => h.CallHandler,
            h => h,
            StringComparer.OrdinalIgnoreCase);
    }

    public IApiCallHandler GetHandler(string callType)
    {
        if (!_handlers.TryGetValue(callType, out var handler))
        {
            throw new KeyNotFoundException($"No API call handler registered for call type '{callType}'.");
        }

        return handler;
    }

    public bool TryGetHandler(string callType, out IApiCallHandler? handler)
        => _handlers.TryGetValue(callType, out handler);
}
