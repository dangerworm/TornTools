using System.Security.Cryptography;
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
        .CountAsync(u => u.KeyAvailable && u.ApiKeyEncrypted != null, stoppingToken);
  }

  public async Task<ApiKeyLeaseDto> GetNextApiKeyAsync(CancellationToken stoppingToken)
  {
    var user = await DbContext.Users
        .Where(u => u.KeyAvailable && u.ApiKeyEncrypted != null)
        .OrderBy(u => u.ApiKeyLastUsed == null ? DateTime.MinValue : u.ApiKeyLastUsed)
        .FirstOrDefaultAsync(stoppingToken);

    if (user == null || user.Id is null || user.ApiKeyEncrypted is null)
    {
      throw new InvalidOperationException("No available API keys found.");
    }

    var plaintext = _apiKeyProtector.Unprotect(user.ApiKeyEncrypted);

    user.ApiKeyLastUsed = DateTime.UtcNow;

    await DbContext.SaveChangesAsync(stoppingToken);

    return new ApiKeyLeaseDto(user.Id.Value, plaintext);
  }

  // Returns the decrypted API key for a specific user. Used by the Torn
  // proxy endpoints — the authenticated user's own key is decrypted per-
  // call, never cached.
  public async Task<string?> GetApiKeyForUserAsync(long userId, CancellationToken stoppingToken)
  {
    var user = await DbContext.Users
        .AsNoTracking()
        .FirstOrDefaultAsync(u => u.Id == userId, stoppingToken);

    if (user?.ApiKeyEncrypted is null) return null;

    return _apiKeyProtector.Unprotect(user.ApiKeyEncrypted);
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

  public async Task<UserDto> UpsertUserDetailsAsync(UserDto userDto, CancellationToken stoppingToken)
  {
    var userEntity = await DbContext.Users
        .Include(u => u.FavouriteItems)
        .FirstOrDefaultAsync(u => u.Id == userDto.Id, stoppingToken);

    if (userEntity == null)
    {
      userEntity = new UserEntity
      {
        Id = userDto.Id,
        ApiKeyEncrypted = _apiKeyProtector.Protect(userDto.ApiKey),
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

      // Only re-encrypt and reset usage state when the plaintext key
      // actually changed. Signing in again with the same key is a no-op
      // on ApiKeyLastUsed / KeyAvailable.
      //
      // Unprotect can throw if the stored ciphertext is corrupted or was
      // encrypted under a retired key version. Treat that as a key change
      // so the user can sign in with a fresh key and overwrite the
      // unreadable row — otherwise a decrypt failure locks them out of
      // their own account via sign-in.
      string? existingPlaintext = null;
      if (userEntity.ApiKeyEncrypted is not null)
      {
        try
        {
          existingPlaintext = _apiKeyProtector.Unprotect(userEntity.ApiKeyEncrypted);
        }
        catch (CryptographicException ex)
        {
          Logger.LogWarning(ex,
              "Stored API key ciphertext for user {UserId} is unreadable; treating sign-in as a key change and re-encrypting.",
              userEntity.Id);
        }
      }

      if (!string.Equals(existingPlaintext, userDto.ApiKey, StringComparison.Ordinal))
      {
        userEntity.ApiKeyEncrypted = _apiKeyProtector.Protect(userDto.ApiKey);
        userEntity.ApiKeyLastUsed = null;
        userEntity.KeyAvailable = true;
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
