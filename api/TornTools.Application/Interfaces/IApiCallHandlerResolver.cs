namespace TornTools.Application.Interfaces;
public interface IApiCallHandlerResolver
{
    IApiCallHandler GetHandler(string callType);
    bool TryGetHandler(string callType, out IApiCallHandler? handler);
}
