using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;
public interface IApiCallerResolver
{
    IApiCaller GetCaller(CallType callType);
    bool TryGetCaller(CallType callType, out IApiCaller? caller);
}
