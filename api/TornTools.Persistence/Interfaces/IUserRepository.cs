using TornTools.Core.DataTransferObjects;

namespace TornTools.Persistence.Interfaces;

public interface IUserRepository
{
    Task<List<UserDto>> GetUsersAsync(IEnumerable<string> excludedUsernames, CancellationToken stoppingToken);
    Task<UserDto?> GetUserByUsernameAsync(string username, CancellationToken stoppingToken);
    Task<int> GetApiKeyCountAsync(CancellationToken stoppingToken);
    Task<string> GetNextApiKeyAsync(CancellationToken stoppingToken);
    Task MarkKeyUnavailableAsync(long userId, CancellationToken stoppingToken);
    Task<UserDto> UpsertUserDetailsAsync(UserDto userDto, CancellationToken stoppingToken);
    Task<UserDto?> ToggleUserFavourite(long userId, int itemId, bool add, CancellationToken stoppingToken);
    Task<IEnumerable<ThemeDto>> GetThemesAsync(long? userId, CancellationToken stoppingToken);
    Task<ThemeDto> UpsertThemeAsync(ThemeDto themeDto, CancellationToken stoppingToken);
    Task<UserDto?> UpdateUserPreferredThemeAsync(long userId, long? themeId, CancellationToken stoppingToken);
}