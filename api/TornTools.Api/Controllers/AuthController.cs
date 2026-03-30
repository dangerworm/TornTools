using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using TornTools.Application.Interfaces;
using TornTools.Api.Authentication;
using TornTools.Core.Constants;
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
  private static readonly CookieOptions AuthCookieOptions = new()
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
    if (keyPayload?.Error is not null || keyPayload?.Info?.User?.Id is null)
      return Unauthorized();

    var userId = (long)keyPayload.Info.User.Id.Value;

    // Get name, level, gender
    string userBasicContent;
    try
    {
      var response = await client.GetAsync(TornApiConstants.UserBasic, cancellationToken);
      if (!response.IsSuccessStatusCode)
      {
        logger.LogWarning("Torn returned {Status} during login for user {UserId}.", (int)response.StatusCode, userId);
        return Unauthorized();
      }

      userBasicContent = await response.Content.ReadAsStringAsync(cancellationToken);
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "Failed to contact Torn API (user basic) during login for user {UserId}.", userId);
      return StatusCode(StatusCodes.Status502BadGateway);
    }

    var userBasicPayload = JsonSerializer.Deserialize<UserBasicPayload>(userBasicContent);
    if (userBasicPayload?.Error is not null || userBasicPayload?.Basic is null)
      return Unauthorized();

    var basic = userBasicPayload.Basic;

    // Upsert user
    var userDetails = new UserDetailsInputModel
    {
      ApiKey = model.ApiKey,
      UserProfile = new UserProfileInputModel
      {
        Id = userId,
        Name = basic.Name ?? string.Empty,
        Level = basic.Level ?? 0,
        Gender = basic.Gender ?? string.Empty
      }
    };

    var user = await databaseService.UpsertUserDetailsAsync(userDetails, cancellationToken);

    // Issue JWT in httpOnly cookie
    var token = jwtService.GenerateToken(userId, user.Name);
    Response.Cookies.Append("auth", token, AuthCookieOptions);

    return Ok(new { userId = user.Id, name = user.Name });
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
}
