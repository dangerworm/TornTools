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

            DbContext.UserFavourites.Add(userFavouriteEntity);
        }
        else if (userFavouriteEntity != null && !add)
        {
            DbContext.UserFavourites.Remove(userFavouriteEntity);
        }

        await DbContext.SaveChangesAsync(stoppingToken);

        var userEntity = await DbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, stoppingToken);
        return userEntity?.AsDto();
    }

    //private static QueueItemEntity CreateEntityFromDto(QueueItemDto itemDto)
    //{
    //    return new QueueItemEntity
    //    {
    //        Id = Guid.NewGuid(),
    //        CallType = itemDto.CallType.ToString(),
    //        EndpointUrl = itemDto.EndpointUrl,
    //        HttpMethod = itemDto.HttpMethod ?? "GET",
    //        ItemStatus = nameof(QueueStatus.Pending),
    //        CreatedAt = DateTime.UtcNow,
    //        NextAttemptAt = itemDto.NextAttemptAt?.ToUniversalTime()
    //    };
    //}
}

