using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;
using TornTools.Application.Interfaces;
using TornTools.Api.Authentication;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Models.InputModels;
using TornTools.Core.Models.TornKey;
using TornTools.Core.Models.TornUser;

namespace TornTools.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory,
    JwtService jwtService,
    ILogger<AuthController> logger
) : ControllerBase
{
  private static CookieOptions AuthCookieOptions => new()
  {
    HttpOnly = true,
    Secure = true,
    SameSite = SameSiteMode.None,
    Expires = DateTimeOffset.UtcNow.AddDays(30)
  };

  [HttpPost("login")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(StatusCodes.Status502BadGateway)]
  public async Task<IActionResult> Login([FromBody] LoginInputModel model, CancellationToken cancellationToken)
  {
    using var client = httpClientFactory.CreateClient(TornApiConstants.ClientName);
    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"ApiKey {model.ApiKey}");

    // Validate the key and get the user ID
    string keyInfoContent;
    try
    {
      var response = await client.GetAsync(TornApiConstants.KeyInfo, cancellationToken);
      if (!response.IsSuccessStatusCode)
      {
        logger.LogWarning("Torn keyinfo returned {Status} during login attempt.", (int)response.StatusCode);
        return Unauthorized();
      }

      keyInfoContent = await response.Content.ReadAsStringAsync(cancellationToken);
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "Failed to contact Torn API (keyinfo) during login.");
      return StatusCode(StatusCodes.Status502BadGateway);
    }

    var keyPayload = JsonSerializer.Deserialize<KeyPayload>(keyInfoContent);
    if (keyPayload?.Error is not null || keyPayload?.Info is null)
      return Unauthorized();

    // Get name, level, gender, and the authoritative user ID
    string userBasicContent;
    try
    {
      var response = await client.GetAsync(TornApiConstants.UserBasic, cancellationToken);
      if (!response.IsSuccessStatusCode)
      {
        logger.LogWarning("Torn returned {Status} during login.", (int)response.StatusCode);
        return Unauthorized();
      }

      userBasicContent = await response.Content.ReadAsStringAsync(cancellationToken);
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "Failed to contact Torn API (user basic) during login.");
      return StatusCode(StatusCodes.Status502BadGateway);
    }

    var userBasicPayload = JsonSerializer.Deserialize<UserBasicPayload>(userBasicContent);
    if (userBasicPayload?.Error is not null || userBasicPayload?.Profile is null)
      return Unauthorized();

    var profile = userBasicPayload.Profile;

    // Upsert user
    var userDetails = new UserDetailsInputModel
    {
      ApiKey = model.ApiKey,
      UserProfile = new UserProfileInputModel
      {
        Id = profile.Id,
        Name = profile.Name ?? string.Empty,
        Level = profile.Level ?? 0,
        Gender = profile.Gender ?? string.Empty
      }
    };

    var user = await databaseService.UpsertUserDetailsAsync(userDetails, cancellationToken);

    // Issue JWT in httpOnly cookie
    var token = jwtService.GenerateToken(profile.Id, user.Name);
    Response.Cookies.Append("auth", token, AuthCookieOptions);

    return Ok(ToResponse(user));
  }

  [HttpGet("me")]
  [Authorize]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(StatusCodes.Status404NotFound)]
  public async Task<IActionResult> Me(CancellationToken cancellationToken)
  {
    var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!long.TryParse(sub, out var userId))
      return Unauthorized();

    var user = await databaseService.GetUserByIdAsync(userId, cancellationToken);
    if (user is null)
      return NotFound();

    return Ok(ToResponse(user));
  }

  [HttpPost("logout")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  public IActionResult Logout()
  {
    Response.Cookies.Delete("auth", new CookieOptions
    {
      HttpOnly = true,
      Secure = true,
      SameSite = SameSiteMode.None
    });

    return Ok();
  }

  private static object ToResponse(UserDto user) => new
  {
    id = user.Id,
    name = user.Name,
    level = user.Level,
    gender = user.Gender,
    favouriteItems = user.FavouriteItems,
    preferredThemeId = user.PreferredThemeId,
    preferredTheme = user.PreferredTheme
  };
}
