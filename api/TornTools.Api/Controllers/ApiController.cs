using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornTools.Application.Interfaces;
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
  public async Task<IActionResult> GetProfitableListings()
  {
    try
    {
      var listings = await _databaseService.GetProfitableListingsAsync(CancellationToken.None);

      if (listings == null || !listings.Any())
        return NotFound("No listings found.");

      return Ok(listings);
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

  [HttpPost(Name = "PostToggleUserFavourite")]
  [Authorize]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(StatusCodes.Status500InternalServerError)]
  public async Task<IActionResult> PostToggleUserFavourite([FromBody] UserFavouriteInputModel userFavouriteModel)
  {
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
}
