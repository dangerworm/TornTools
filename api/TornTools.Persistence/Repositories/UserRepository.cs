using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Interfaces;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;

public class UserRepository(
    ILogger<UserRepository> logger,
    TornToolsDbContext dbContext,
    IApiKeyProtector apiKeyProtector
) : RepositoryBase<UserRepository>(logger, dbContext), IUserRepository
{
  private readonly IApiKeyProtector _apiKeyProtector = apiKeyProtector;

  public async Task<UserDto?> GetUserByIdAsync(long userId, CancellationToken stoppingToken)
  {
    var entity = await DbContext.Users
        .Include(u => u.FavouriteItems)
        .FirstOrDefaultAsync(u => u.Id == userId, stoppingToken);

    return entity?.AsDto();
  }

  public Task<List<UserDto>> GetUsersAsync(CancellationToken stoppingToken)
  {
    return DbContext.Users
        .Select(u => u.AsDto())
        .ToListAsync(stoppingToken);
  }

  public Task<int> GetApiKeyCountAsync(CancellationToken stoppingToken)
  {
    return DbContext.Users
        .CountAsync(u =>
            u.KeyAvailable &&
            (u.ApiKeyEncrypted != null || !string.IsNullOrEmpty(u.ApiKey)),
            stoppingToken);
  }

  public async Task<ApiKeyLeaseDto> GetNextApiKeyAsync(CancellationToken stoppingToken)
  {
    var user = await DbContext.Users
        .Where(u =>
            u.KeyAvailable &&
            (u.ApiKeyEncrypted != null || !string.IsNullOrEmpty(u.ApiKey)))
        .OrderBy(u => u.ApiKeyLastUsed == null ? DateTime.MinValue : u.ApiKeyLastUsed)
        .FirstOrDefaultAsync(stoppingToken);

    if (user == null || user.Id is null)
    {
      throw new InvalidOperationException("No available API keys found.");
    }

    // Prefer the encrypted column. Fall back to plaintext for rows that
    // haven't been backfilled yet — those get re-upserted via the startup
    // backfill, which populates the encrypted column in-place.
    var plaintext = user.ApiKeyEncrypted is not null
        ? _apiKeyProtector.Unprotect(user.ApiKeyEncrypted)
        : user.ApiKey;

    user.ApiKeyLastUsed = DateTime.UtcNow;

    await DbContext.SaveChangesAsync(stoppingToken);

    return new ApiKeyLeaseDto(user.Id.Value, plaintext);
  }

  // Returns the decrypted API key for a specific user (resolves the
  // encrypted column if populated, falls back to plaintext). Used by the
  // Torn proxy endpoints — the authenticated user's own key is decrypted
  // per-call, never cached.
  public async Task<string?> GetApiKeyForUserAsync(long userId, CancellationToken stoppingToken)
  {
    var user = await DbContext.Users
        .AsNoTracking()
        .FirstOrDefaultAsync(u => u.Id == userId, stoppingToken);

    if (user is null) return null;

    if (user.ApiKeyEncrypted is not null)
    {
      return _apiKeyProtector.Unprotect(user.ApiKeyEncrypted);
    }

    return string.IsNullOrEmpty(user.ApiKey) ? null : user.ApiKey;
  }

  public async Task MarkKeyUnavailableAsync(long userId, CancellationToken stoppingToken)
  {
    var user = await DbContext.Users
        .FirstOrDefaultAsync(u => u.Id == userId, stoppingToken);

    if (user is not null)
    {
      user.KeyAvailable = false;
      await DbContext.SaveChangesAsync(stoppingToken);
    }
  }

  // One-shot encryption pass run at startup. For every row with a plaintext
  // key but no encrypted column, encrypt and write it in place. Idempotent:
  // running this against a fully-migrated table is a no-op.
  public async Task<int> BackfillEncryptedApiKeysAsync(CancellationToken stoppingToken)
  {
    var pending = await DbContext.Users
        .Where(u => u.ApiKeyEncrypted == null && !string.IsNullOrEmpty(u.ApiKey))
        .ToListAsync(stoppingToken);

    foreach (var user in pending)
    {
      user.ApiKeyEncrypted = _apiKeyProtector.Protect(user.ApiKey);
    }

    if (pending.Count > 0)
    {
      await DbContext.SaveChangesAsync(stoppingToken);
    }

    return pending.Count;
  }

  public async Task<UserDto> UpsertUserDetailsAsync(UserDto userDto, CancellationToken stoppingToken)
  {
    var userEntity = await DbContext.Users
        .Include(u => u.FavouriteItems)
        .FirstOrDefaultAsync(u => u.Id == userDto.Id, stoppingToken);

    // Dual-write window: populate both columns so a rollback is possible.
    // A follow-up migration drops the plaintext column once every row is
    // encrypted and verified.
    var encryptedKey = _apiKeyProtector.Protect(userDto.ApiKey);

    if (userEntity == null)
    {
      userEntity = new UserEntity
      {
        Id = userDto.Id,
        ApiKey = userDto.ApiKey,
        ApiKeyEncrypted = encryptedKey,
        ApiKeyLastUsed = null,
        KeyAvailable = true,
        Name = userDto.Name,
        Gender = userDto.Gender,
        Level = userDto.Level,
        AccessLevel = userDto.AccessLevel
      };

      DbContext.Users.Add(userEntity);
    }
    else
    {
      userEntity.Name = userDto.Name;
      userEntity.Gender = userDto.Gender;
      userEntity.AccessLevel = userDto.AccessLevel;

      if (!string.Equals(userEntity.ApiKey, userDto.ApiKey, StringComparison.Ordinal))
      {
        userEntity.ApiKey = userDto.ApiKey;
        userEntity.ApiKeyEncrypted = encryptedKey;
        userEntity.ApiKeyLastUsed = null;
        userEntity.KeyAvailable = true;
      }
      else if (userEntity.ApiKeyEncrypted is null)
      {
        // Same plaintext, but encrypted column hasn't been populated yet —
        // backfill it opportunistically.
        userEntity.ApiKeyEncrypted = encryptedKey;
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
        .FirstOrDefaultAsync(u => u.Id == userId, stoppingToken);

    return userEntity?.AsDto();
  }
}
