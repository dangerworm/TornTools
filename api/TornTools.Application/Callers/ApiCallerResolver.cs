using TornTools.Application.Interfaces;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public class ApiCallerResolver : IApiCallerResolver
{
    private readonly Dictionary<CallType, IApiCaller> _callers;

    public ApiCallerResolver(IEnumerable<IApiCaller> callers)
    {
        _callers = [];
        foreach (var callType in Enum.GetValues<CallType>())
        {
            var applicableCallers = callers.Where(callers => callers.CallTypes.Contains(callType));

            foreach (var caller in applicableCallers)
            {
                _callers.TryAdd(callType, caller);
            }
        }
    }

    public IApiCaller GetCaller(CallType callType)
    {
        if (!_callers.TryGetValue(callType, out var caller))
        {
            throw new KeyNotFoundException($"No API caller registered for call type '{callType}'.");
        }

        return caller;
    }

    public bool TryGetCaller(CallType callType, out IApiCaller? caller)
        => _callers.TryGetValue(callType, out caller);
}
