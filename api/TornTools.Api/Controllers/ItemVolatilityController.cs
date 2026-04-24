using Microsoft.AspNetCore.Mvc;
using TornTools.Application.Interfaces;
using TornTools.Core.Enums;
using TornTools.Persistence.Interfaces;

namespace TornTools.Api.Controllers;

[ApiController]
[Route("api/items/volatility")]
public class ItemVolatilityController(
    ILogger<ItemVolatilityController> logger,
    IDatabaseService databaseService
) : ControllerBase
{
  private readonly ILogger<ItemVolatilityController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
  private readonly IDatabaseService _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));

  private static Source ParseSource(string? source)
  {
    if (string.IsNullOrWhiteSpace(source)) return Source.Torn;
    return Enum.TryParse<Source>(source, ignoreCase: true, out var parsed) ? parsed : Source.Torn;
  }

  private static VolatilitySortKey ParseSortKey(string? sort)
  {
    // Default matches the "most active items" use case most consumers will
    // want first. Alternative sorts are opt-in via ?sort=.
    if (string.IsNullOrWhiteSpace(sort)) return VolatilitySortKey.Changes1d;
    return sort.ToLowerInvariant() switch
    {
      "changes_1d" or "changes-1d" => VolatilitySortKey.Changes1d,
      "changes_1w" or "changes-1w" => VolatilitySortKey.Changes1w,
      "price_change_1d" or "price-change-1d" => VolatilitySortKey.PriceChange1d,
      "price_change_1w" or "price-change-1w" => VolatilitySortKey.PriceChange1w,
      "move_z_score_1d" or "move-z-score-1d" => VolatilitySortKey.MoveZScore1d,
      _ => VolatilitySortKey.Changes1d,
    };
  }

  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK)]
  public async Task<IActionResult> GetTopVolatile(
      [FromQuery] string? source,
      [FromQuery] string? sort,
      [FromQuery] int? limit,
      [FromQuery] bool? ascending,
      CancellationToken cancellationToken)
  {
    var resolvedLimit = Math.Clamp(limit ?? 20, 1, 100);
    try
    {
      var results = await _databaseService.GetTopVolatileItemsAsync(
          ParseSource(source),
          ParseSortKey(sort),
          resolvedLimit,
          ascending ?? false,
          cancellationToken);
      return Ok(results);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to retrieve volatility stats.");
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = "An error occurred while retrieving volatility stats."
      });
    }
  }
}
