using Microsoft.AspNetCore.Mvc;
using TornTools.Application.Interfaces;
using TornTools.Core.Enums;

namespace TornTools.Api.Controllers;

[ApiController]
[Route("api/items/unusual")]
public class UnusualController(
    ILogger<UnusualController> logger,
    IDatabaseService databaseService
) : ControllerBase
{
  private readonly ILogger<UnusualController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
  private readonly IDatabaseService _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));

  // Default minimum unusualness score for the home-page widget. Items
  // with smaller departures from baseline are statistical noise — see
  // the 2026-04-24 Top Movers review for the dispersion-based filtering
  // logic. Tunable per request.
  private const decimal DefaultMinScore = 1.5m;

  private static Source ParseSource(string? source)
  {
    if (string.IsNullOrWhiteSpace(source)) return Source.Torn;
    return Enum.TryParse<Source>(source, ignoreCase: true, out var parsed) ? parsed : Source.Torn;
  }

  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK)]
  public async Task<IActionResult> GetTopUnusual(
      [FromQuery] string? source,
      [FromQuery] int? limit,
      [FromQuery] decimal? minScore,
      CancellationToken cancellationToken)
  {
    var resolvedLimit = Math.Clamp(limit ?? 15, 1, 50);
    var resolvedMinScore = minScore ?? DefaultMinScore;

    try
    {
      var results = await _databaseService.GetTopUnusualItemsAsync(
          ParseSource(source),
          resolvedLimit,
          resolvedMinScore,
          cancellationToken);
      return Ok(results);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to retrieve unusual-activity candidates.");
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = "An error occurred while retrieving unusual-activity candidates."
      });
    }
  }
}
