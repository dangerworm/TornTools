namespace TornTools.Application.Exceptions;

/// <summary>
/// Thrown when a Torn API response indicates the key is permanently or semi-permanently
/// unavailable (e.g. incorrect key, owner inactive). The caller should mark the key
/// as unavailable in the database so it is no longer selected for API calls.
/// </summary>
public class TornKeyUnavailableException(int errorCode, string errorMessage)
    : Exception($"Torn API key is unavailable (code {errorCode}): {errorMessage}")
{
  public int ErrorCode { get; } = errorCode;
}
