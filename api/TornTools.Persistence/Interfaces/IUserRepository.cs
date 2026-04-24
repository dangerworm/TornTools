using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;

public interface IUserRepository
{
  Task<UserDto?> GetUserByIdAsync(long userId, CancellationToken stoppingToken);
  Task<List<UserDto>> GetUsersAsync(CancellationToken stoppingToken);
  Task<int> GetApiKeyCountAsync(CancellationToken stoppingToken);
  Task<ApiKeyLeaseDto> GetNextApiKeyAsync(CancellationToken stoppingToken);
  Task<string?> GetApiKeyForUserAsync(long userId, CancellationToken stoppingToken);
  Task MarkKeyUnavailableAsync(long userId, CancellationToken stoppingToken);
  Task<int> BackfillEncryptedApiKeysAsync(CancellationToken stoppingToken);
  Task<UserDto> UpsertUserDetailsAsync(UserDto userDto, CancellationToken stoppingToken);
  Task<UserDto?> ToggleUserFavourite(long userId, int itemId, bool add, CancellationToken stoppingToken);
}