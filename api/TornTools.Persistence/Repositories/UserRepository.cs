using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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

