using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Models.InputModels;

namespace TornTools.Api.Controllers;

[ApiController]
[Route("[controller]/[action]")]
public class ApiController(
    ILogger<ApiController> logger,
    IDatabaseService databaseService
) : ControllerBase
{
  private readonly ILogger<ApiController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
  private readonly IDatabaseService _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));

  private const string ErrorMessage = "An error occurred while retrieving {0}.";

  [HttpGet(Name = "GetItems")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetItems(CancellationToken cancellationToken)
  {
    try
    {
      var items = await _databaseService.GetAllItemsAsync(cancellationToken);

      if (items == null || !items.Any())
        return NotFound("No items found.");

      return Ok(items);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while retrieving {EntityType}.", "items");

      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = string.Format(ErrorMessage, "items")
      });
    }
  }

  [HttpGet(Name = "GetForeignStockItems")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetForeignStockItems(CancellationToken cancellationToken)
  {
    try
    {
      var items = await _databaseService.GetForeignStockItemsAsync(cancellationToken);

      if (items == null || !items.Any())
        return NotFound("No items found.");

      return Ok(items);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while retrieving {EntityType}.", "foreign stock items");

      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = string.Format(ErrorMessage, "foreign stock items")
      });
    }
  }

  [HttpGet(Name = "GetProfitableListings")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetProfitableListings(CancellationToken cancellationToken)
  {
    try
    {
      var listings = await _databaseService.GetProfitableListingsAsync(cancellationToken);

      return Ok(listings ?? Enumerable.Empty<ProfitableListingDto>());
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while retrieving {EntityType}.", "listings");

      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = string.Format(ErrorMessage, "listings")
      });
    }
  }

  [HttpGet(Name = "GetBazaarSummaries")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetBazaarSummaries(CancellationToken cancellationToken)
  {
    try
    {
      var summaries = await _databaseService.GetBazaarSummariesAsync(cancellationToken);
      return Ok(summaries ?? Enumerable.Empty<BazaarSummaryDto>());
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while retrieving {EntityType}.", "bazaar summaries");
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = string.Format(ErrorMessage, "bazaar summaries")
      });
    }
  }

  [HttpPost(Name = "PostWeav3rListings")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> PostWeav3rListings([FromBody] WeakListingsInputModel payload, CancellationToken cancellationToken)
  {
    if (payload.Listings.Count == 0)
      return Ok();

    try
    {
      var correlationId = Guid.NewGuid();
      var listings = payload.Listings
          .Select((l, i) => new ListingDto
          {
            CorrelationId = correlationId,
            Source = Source.Weav3r,
            PlayerId = l.PlayerId,
            ItemId = payload.ItemId,
            ListingPosition = i,
            TimeSeen = DateTimeOffset.UtcNow,
            Price = l.Price,
            Quantity = l.Quantity,
          })
          .ToList();

      await _databaseService.ProcessListingsAsync(Source.Weav3r, payload.ItemId, listings, cancellationToken);
      return Ok();
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while processing Weav3r listings for item {ItemId}.", payload.ItemId);
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = string.Format(ErrorMessage, "Weav3r listings")
      });
    }
  }

  [HttpPost(Name = "PostToggleUserFavourite")]
  [Authorize]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> PostToggleUserFavourite([FromBody] UserFavouriteInputModel userFavouriteModel)
  {
    if (!TryGetAuthenticatedUserId(out var authenticatedUserId) || authenticatedUserId != userFavouriteModel.UserId)
      return Unauthorized();

    try
    {
      var user = await _databaseService.ToggleUserFavourite(userFavouriteModel, CancellationToken.None);
      return Ok(user);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while toggling user favourite.");
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = "An error occurred while toggling user favourite."
      });
    }
  }

  [HttpGet(Name = "GetThemes")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> GetThemes(long? userId, CancellationToken cancellationToken)
  {
    try
    {
      var themes = await _databaseService.GetThemesAsync(userId, cancellationToken);
      return Ok(themes);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while retrieving themes.");
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = string.Format(ErrorMessage, "themes")
      });
    }
  }

  [HttpPost(Name = "PostTheme")]
  [Authorize]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> PostTheme([FromBody] ThemeInputModel themeInput)
  {
    try
    {
      var theme = await _databaseService.UpsertThemeAsync(themeInput, CancellationToken.None);
      return Ok(theme);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while saving a theme.");
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = "An error occurred while saving a theme."
      });
    }
  }

  [HttpPost(Name = "PostUserThemeSelection")]
  [Authorize]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> PostUserThemeSelection([FromBody] UserThemeSelectionInputModel themeSelection)
  {
    if (!TryGetAuthenticatedUserId(out var authenticatedUserId) || authenticatedUserId != themeSelection.UserId)
      return Unauthorized();

    try
    {
      var user = await _databaseService.UpdateUserPreferredThemeAsync(themeSelection, CancellationToken.None);
      return Ok(user);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "An error occurred while saving user settings.");
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = "An error occurred while saving user settings."
      });
    }
  }

  private bool TryGetAuthenticatedUserId(out long userId)
  {
    var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
    return long.TryParse(sub, out userId);
  }
}
