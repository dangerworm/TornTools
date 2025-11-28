using System;
using Microsoft.AspNetCore.Http;
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

    [HttpGet("price")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPriceHistory(int itemId, [FromQuery] string? window, CancellationToken cancellationToken)
    {
        if (!HistoryWindowExtensions.TryParse(window, out var historyWindow))
        {
            return BadRequest("Invalid time window specified.");
        }

        try
        {
            var history = await _databaseService.GetItemPriceHistoryAsync(itemId, historyWindow, cancellationToken);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve price history for item {ItemId}.", itemId);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = string.Format(ErrorMessage, "price"),
                details = ex.Message
            });
        }
    }

    [HttpGet("velocity")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetVelocityHistory(int itemId, [FromQuery] string? window, CancellationToken cancellationToken)
    {
        if (!HistoryWindowExtensions.TryParse(window, out var historyWindow))
        {
            return BadRequest("Invalid time window specified.");
        }

        try
        {
            var history = await _databaseService.GetItemVelocityHistoryAsync(itemId, historyWindow, cancellationToken);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve velocity history for item {ItemId}.", itemId);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = string.Format(ErrorMessage, "velocity"),
                details = ex.Message
            });
        }
    }
}
