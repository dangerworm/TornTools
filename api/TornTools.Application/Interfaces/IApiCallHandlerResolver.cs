using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;
public interface IApiCallHandlerResolver
{
    IApiCallHandler GetHandler(ApiCallType callType);
    bool TryGetHandler(ApiCallType callType, out IApiCallHandler? handler);
}
