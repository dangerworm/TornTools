using Microsoft.AspNetCore.Mvc;
using TornTools.Application.Interfaces;
using TornTools.Core.Enums;
using TornTools.Core.Extensions;

namespace TornTools.Api.Controllers;

[ApiController]
[Route("api/items/{itemId:int}/history")]
public class ItemHistoryController(
    ILogger<ItemHistoryController> logger,
    IDatabaseService databaseService
) : ControllerBase
{
  private readonly ILogger<ItemHistoryController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
  private readonly IDatabaseService _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
  private const string ErrorMessage = "An error occurred while retrieving {0} history.";

  private static Source ParseSource(string? source)
  {
    // Default to the Torn market so existing callers (no ?source=) keep
    // their current behaviour. Weav3r is the bazaar line.
    if (string.IsNullOrWhiteSpace(source)) return Source.Torn;
    return Enum.TryParse<Source>(source, ignoreCase: true, out var parsed) ? parsed : Source.Torn;
  }

  [HttpGet("price")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> GetPriceHistory(int itemId, [FromQuery] string? window, [FromQuery] string? source, CancellationToken cancellationToken)
  {
    if (!HistoryWindowExtensions.TryParse(window, out var historyWindow))
    {
      return BadRequest("Invalid time window specified.");
    }

    try
    {
      var history = await _databaseService.GetItemPriceHistoryAsync(itemId, historyWindow, ParseSource(source), cancellationToken);
      return Ok(history);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to retrieve price history for item {ItemId}.", itemId);
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = string.Format(ErrorMessage, "price")
      });
    }
  }

  [HttpGet("velocity")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status400BadRequest)]
  public async Task<IActionResult> GetVelocityHistory(int itemId, [FromQuery] string? window, [FromQuery] string? source, CancellationToken cancellationToken)
  {
    if (!HistoryWindowExtensions.TryParse(window, out var historyWindow))
    {
      return BadRequest("Invalid time window specified.");
    }

    try
    {
      var history = await _databaseService.GetItemVelocityHistoryAsync(itemId, historyWindow, ParseSource(source), cancellationToken);
      return Ok(history);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to retrieve velocity history for item {ItemId}.", itemId);
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = string.Format(ErrorMessage, "velocity")
      });
    }
  }
}
