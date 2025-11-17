namespace TornTools.Persistence.Interfaces;

public interface IUserRepository
{
    Task<int> GetApiKeyCountAsync(CancellationToken stoppingToken);
    Task<string> GetNextApiKeyAsync(CancellationToken stoppingToken);
}