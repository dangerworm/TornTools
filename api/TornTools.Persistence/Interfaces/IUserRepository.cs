using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;

public interface IUserRepository
{
    Task<int> GetApiKeyCountAsync(CancellationToken stoppingToken);
    Task<string> GetNextApiKeyAsync(CancellationToken stoppingToken);
    Task<UserDto> UpsertUserDetailsAsync(UserDto userDto, CancellationToken stoppingToken);
    Task<UserDto?> ToggleUserFavourite(long userId, int itemId, bool add, CancellationToken stoppingToken);
}