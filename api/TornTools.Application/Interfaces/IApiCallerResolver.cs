using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;
public interface IApiCallerResolver
{
    IApiCaller GetCaller(ApiCallType callType);
    bool TryGetCaller(ApiCallType callType, out IApiCaller? caller);
}
