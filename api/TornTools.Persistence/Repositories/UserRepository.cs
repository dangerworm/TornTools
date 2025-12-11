using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TornTools.Core.DataTransferObjects;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;
public class UserRepository(
    ILogger<UserRepository> logger,
    TornToolsDbContext dbContext
) : RepositoryBase<UserRepository>(logger, dbContext), IUserRepository
{
    public Task<int> GetApiKeyCountAsync(CancellationToken stoppingToken)
    {
        return DbContext.Users.CountAsync(stoppingToken);
    }

    public async Task<string> GetNextApiKeyAsync(CancellationToken stoppingToken)
    {
        var user = await DbContext.Users
            .Where(u => !string.IsNullOrEmpty(u.ApiKey))
            .OrderBy(u => u.ApiKeyLastUsed == null ? DateTime.MinValue : u.ApiKeyLastUsed)
            .FirstAsync(stoppingToken);

        user.ApiKeyLastUsed = DateTime.UtcNow;

        await DbContext.SaveChangesAsync(stoppingToken);

        return user.ApiKey;
    }

    public async Task<UserDto> UpsertUserDetailsAsync(UserDto userDto, CancellationToken stoppingToken)
    {
        var userEntity = await DbContext.Users
            .Include(u => u.FavouriteItems)
            .Include(u => u.PreferredTheme)
            .FirstOrDefaultAsync(u => u.Id == userDto.Id, stoppingToken);

        if (userEntity == null)
        {
            userEntity = new UserEntity
            {
                Id = userDto.Id,
                ApiKey = userDto.ApiKey,
                ApiKeyLastUsed = null,
                Name = userDto.Name,
                Gender = userDto.Gender,
                Level = userDto.Level
            };

            DbContext.Users.Add(userEntity);
        }
        else
        {
            userEntity.Name = userDto.Name;
            userEntity.Gender = userDto.Gender;

            if (!string.Equals(userEntity.ApiKey, userDto.ApiKey, StringComparison.Ordinal))
            {
                userEntity.ApiKey = userDto.ApiKey;
                userEntity.ApiKeyLastUsed = null;
            }
        }

        if (userEntity.PreferredThemeId == null)
        {
            var defaultTheme = await DbContext.Themes
                .Where(t => t.UserId == null)
                .OrderBy(t => t.Id)
                .FirstOrDefaultAsync(stoppingToken);

            if (defaultTheme != null)
            {
                userEntity.PreferredThemeId = defaultTheme.Id;
                userEntity.PreferredTheme = defaultTheme;
            }
        }

        await DbContext.SaveChangesAsync(stoppingToken);

        return userEntity.AsDto();
    }

    public async Task<UserDto?> ToggleUserFavourite(long userId, int itemId, bool add, CancellationToken stoppingToken)
    {
        var userFavouriteEntity = await DbContext.UserFavourites
            .FirstOrDefaultAsync(uf => uf.UserId == userId && uf.ItemId == itemId, stoppingToken);

        if (userFavouriteEntity == null && add)
        {
            userFavouriteEntity = new UserFavouriteItemEntity
            {
                UserId = userId,
                ItemId = itemId
            };

            await DbContext.UserFavourites.AddAsync(userFavouriteEntity, stoppingToken);
        }
        else if (userFavouriteEntity != null && !add)
        {
            DbContext.UserFavourites.Remove(userFavouriteEntity);
        }

        await DbContext.SaveChangesAsync(stoppingToken);

        var userEntity = await DbContext.Users
            .Include(u => u.FavouriteItems)
            .Include(u => u.PreferredTheme)
            .FirstOrDefaultAsync(u => u.Id == userId, stoppingToken);

        return userEntity?.AsDto();
    }

    public async Task<IEnumerable<ThemeDto>> GetThemesAsync(long? userId, CancellationToken stoppingToken)
    {
        return await DbContext.Themes
            .AsNoTracking()
            .Where(t => t.UserId == null || t.UserId == userId)
            .OrderBy(t => t.Name)
            .Select(t => t.AsDto())
            .ToListAsync(stoppingToken);
    }

    public async Task<ThemeDto> UpsertThemeAsync(ThemeDto themeDto, CancellationToken stoppingToken)
    {
        var themeEntity = await DbContext.Themes
            .FirstOrDefaultAsync(t => t.Id == themeDto.Id, stoppingToken);

        if (themeEntity == null)
        {
            themeEntity = new ThemeEntity
            {
                Name = themeDto.Name,
                Mode = themeDto.Mode,
                PrimaryColor = themeDto.PrimaryColor,
                SecondaryColor = themeDto.SecondaryColor,
                UserId = themeDto.UserId
            };

            await DbContext.Themes.AddAsync(themeEntity, stoppingToken);
        }
        else
        {
            themeEntity.Name = themeDto.Name;
            themeEntity.Mode = themeDto.Mode;
            themeEntity.PrimaryColor = themeDto.PrimaryColor;
            themeEntity.SecondaryColor = themeDto.SecondaryColor;
            themeEntity.UserId = themeDto.UserId;
        }

        await DbContext.SaveChangesAsync(stoppingToken);
        return themeEntity.AsDto();
    }

    public async Task<UserDto?> UpdateUserPreferredThemeAsync(long userId, long? themeId, CancellationToken stoppingToken)
    {
        var userEntity = await DbContext.Users
            .Include(u => u.FavouriteItems)
            .Include(u => u.PreferredTheme)
            .FirstOrDefaultAsync(u => u.Id == userId, stoppingToken);

        if (userEntity == null)
        {
            return null;
        }

        userEntity.PreferredThemeId = themeId;

        await DbContext.SaveChangesAsync(stoppingToken);

        return userEntity.AsDto();
    }
}

