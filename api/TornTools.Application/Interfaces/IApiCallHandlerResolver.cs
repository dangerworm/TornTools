using TornTools.Core.Enums;

namespace TornTools.Application.Interfaces;
public interface IApiCallHandlerResolver
{
    IApiCallHandler GetHandler(CallType callType);
    bool TryGetHandler(CallType callType, out IApiCallHandler? handler);
}
