using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;

namespace TornTools.Api.Controllers;

// Server-side proxy for the Torn API calls the browser used to make
// directly. Decrypts the authenticated user's stored key per-call; the
// plaintext never leaves the request scope. /key/validate accepts an
// arbitrary key in the body and is used during sign-in preview — that's
// the only path where plaintext travels browser-to-backend after Phase 2.
[ApiController]
[Route("api/torn")]
public class TornController(
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory,
    ILogger<TornController> logger
) : ControllerBase
{
  private const string CommentParam = "comment=dangerworm%27s%20Tools";

  [HttpGet("user/basic")]
  [Authorize]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(StatusCodes.Status502BadGateway)]
  public async Task<IActionResult> GetUserBasic(CancellationToken cancellationToken)
  {
    var apiKey = await ResolveCurrentUserApiKeyAsync(cancellationToken);
    if (apiKey is null) return Unauthorized();

    return await ProxyTornGet($"{TornApiConstants.UserBasic}?stripTags=false&{CommentParam}", apiKey, cancellationToken);
  }

  [HttpGet("user/inventory")]
  [Authorize]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status400BadRequest)]
  [ProducesResponseType(StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(StatusCodes.Status502BadGateway)]
  public async Task<IActionResult> GetUserInventory([FromQuery] string? cat, CancellationToken cancellationToken)
  {
    if (string.IsNullOrWhiteSpace(cat))
    {
      return BadRequest("Missing required query parameter: cat");
    }

    var apiKey = await ResolveCurrentUserApiKeyAsync(cancellationToken);
    if (apiKey is null) return Unauthorized();

    // Walk all pages server-side and aggregate, matching the previous
    // browser-side behaviour in fetchTornInventory.
    using var client = httpClientFactory.CreateClient(TornApiConstants.ClientName);
    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"ApiKey {apiKey}");

    var allItems = new List<JsonElement>();
    JsonElement? lastMetadata = null;
    string? nextUrl = $"{TornApiConstants.UserInventory}?cat={Uri.EscapeDataString(cat)}&offset=0&limit=250&{CommentParam}";

    while (!string.IsNullOrEmpty(nextUrl))
    {
      var response = await client.GetAsync(nextUrl, cancellationToken);
      if (!response.IsSuccessStatusCode)
      {
        logger.LogWarning("Torn inventory proxy returned {Status} for cat {Cat}.", (int)response.StatusCode, cat);
        return StatusCode(StatusCodes.Status502BadGateway);
      }

      var body = await response.Content.ReadAsStringAsync(cancellationToken);
      using var doc = JsonDocument.Parse(body);
      var root = doc.RootElement;

      if (root.TryGetProperty("error", out var errorElement) && errorElement.ValueKind != JsonValueKind.Null)
      {
        return StatusCode(StatusCodes.Status502BadGateway, new { error = errorElement.Clone() });
      }

      if (root.TryGetProperty("inventory", out var inventoryElement) &&
          inventoryElement.ValueKind == JsonValueKind.Object &&
          inventoryElement.TryGetProperty("items", out var itemsElement) &&
          itemsElement.ValueKind == JsonValueKind.Array)
      {
        foreach (var item in itemsElement.EnumerateArray())
        {
          allItems.Add(item.Clone());
        }
      }

      if (root.TryGetProperty("_metadata", out var metadataElement) &&
          metadataElement.ValueKind == JsonValueKind.Object)
      {
        lastMetadata = metadataElement.Clone();

        if (metadataElement.TryGetProperty("links", out var linksElement) &&
            linksElement.TryGetProperty("next", out var nextElement) &&
            nextElement.ValueKind == JsonValueKind.String)
        {
          nextUrl = nextElement.GetString();
          continue;
        }
      }

      nextUrl = null;
    }

    return Ok(new
    {
      inventory = new
      {
        items = allItems,
        timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
      },
      _metadata = lastMetadata
    });
  }

  // Validate a typed key and return both the access-level info and the
  // Torn user profile in one round-trip, so the sign-in preview can show
  // "You're about to sign in as X (Minimal access)" without two client-
  // side requests. This is the only path that carries a plaintext key
  // from the browser to the backend after sign-in.
  [HttpPost("key/validate")]
  [AllowAnonymous]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status400BadRequest)]
  [ProducesResponseType(StatusCodes.Status502BadGateway)]
  public async Task<IActionResult> ValidateKey([FromBody] ValidateKeyRequest request, CancellationToken cancellationToken)
  {
    if (request is null || string.IsNullOrWhiteSpace(request.ApiKey))
    {
      return BadRequest("Missing required field: apiKey");
    }

    using var client = httpClientFactory.CreateClient(TornApiConstants.ClientName);
    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"ApiKey {request.ApiKey}");

    try
    {
      var infoTask = client.GetStringAsync($"{TornApiConstants.KeyInfo}?{CommentParam}", cancellationToken);
      var basicTask = client.GetStringAsync($"{TornApiConstants.UserBasic}?stripTags=false&{CommentParam}", cancellationToken);
      await Task.WhenAll(infoTask, basicTask);

      using var infoDoc = JsonDocument.Parse(await infoTask);
      using var basicDoc = JsonDocument.Parse(await basicTask);

      return Ok(new
      {
        info = infoDoc.RootElement.TryGetProperty("info", out var info) ? (JsonElement?)info.Clone() : null,
        profile = basicDoc.RootElement.TryGetProperty("profile", out var profile) ? (JsonElement?)profile.Clone() : null,
        error = infoDoc.RootElement.TryGetProperty("error", out var infoErr)
            ? (JsonElement?)infoErr.Clone()
            : basicDoc.RootElement.TryGetProperty("error", out var basicErr)
                ? (JsonElement?)basicErr.Clone()
                : null,
      });
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "Torn key validation failed.");
      return StatusCode(StatusCodes.Status502BadGateway);
    }
  }

  public record ValidateKeyRequest(string ApiKey);

  private async Task<string?> ResolveCurrentUserApiKeyAsync(CancellationToken cancellationToken)
  {
    var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!long.TryParse(sub, out var userId)) return null;
    return await databaseService.GetApiKeyForUserAsync(userId, cancellationToken);
  }

  private async Task<IActionResult> ProxyTornGet(string url, string apiKey, CancellationToken cancellationToken)
  {
    using var client = httpClientFactory.CreateClient(TornApiConstants.ClientName);
    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"ApiKey {apiKey}");

    try
    {
      var response = await client.GetAsync(url, cancellationToken);
      var body = await response.Content.ReadAsStringAsync(cancellationToken);
      if (!response.IsSuccessStatusCode)
      {
        logger.LogWarning("Torn proxy returned {Status} for {Url}.", (int)response.StatusCode, url);
        return StatusCode(StatusCodes.Status502BadGateway);
      }

      return Content(body, "application/json");
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "Torn proxy call to {Url} failed.", url);
      return StatusCode(StatusCodes.Status502BadGateway);
    }
  }
}
