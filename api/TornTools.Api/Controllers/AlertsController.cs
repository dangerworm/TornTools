using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TornTools.Application.Interfaces;

namespace TornTools.Api.Controllers;

// Bargain alerts (Drew-only v1). All endpoints require authentication
// and gate on BargainAlertsConfiguration.AuthorisedPlayerIds. Anyone
// else gets 403 from /active and /dismiss; /authorised returns false
// without leaking that the feature exists for someone else.
[ApiController]
[Route("api/alerts")]
[Authorize]
public class AlertsController(
    ILogger<AlertsController> logger,
    IBargainAlertService bargainAlertService,
    IBargainAlertAuthService bargainAlertAuthService
) : ControllerBase
{
  private readonly ILogger<AlertsController> _logger = logger;
  private readonly IBargainAlertService _bargainAlertService = bargainAlertService;
  private readonly IBargainAlertAuthService _bargainAlertAuthService = bargainAlertAuthService;

  // Whether the current user is allowed to receive bargain alerts. The
  // frontend hits this once at app-mount; if false, it skips polling
  // /active entirely. Returns false (rather than 403) so the response
  // shape is uniform for authed users regardless of permission.
  [HttpGet("authorised")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  public IActionResult GetAuthorised()
  {
    if (!TryGetAuthenticatedPlayerId(out var playerId))
      return Ok(new { authorised = false });

    return Ok(new { authorised = _bargainAlertAuthService.IsAuthorised(playerId) });
  }

  [HttpGet("active")]
  [ProducesResponseType(StatusCodes.Status200OK)]
  [ProducesResponseType(StatusCodes.Status403Forbidden)]
  public async Task<IActionResult> GetActive(CancellationToken cancellationToken)
  {
    if (!TryGetAuthenticatedPlayerId(out var playerId) ||
        !_bargainAlertAuthService.IsAuthorised(playerId))
      return Forbid();

    try
    {
      var alerts = await _bargainAlertService.GetActiveAlertsAsync(cancellationToken);
      return Ok(alerts);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to retrieve active bargain alerts.");
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = "An error occurred while retrieving active bargain alerts."
      });
    }
  }

  [HttpPost("{id:long}/dismiss")]
  [ProducesResponseType(StatusCodes.Status204NoContent)]
  [ProducesResponseType(StatusCodes.Status403Forbidden)]
  [ProducesResponseType(StatusCodes.Status404NotFound)]
  public async Task<IActionResult> Dismiss(long id, CancellationToken cancellationToken)
  {
    if (!TryGetAuthenticatedPlayerId(out var playerId) ||
        !_bargainAlertAuthService.IsAuthorised(playerId))
      return Forbid();

    try
    {
      var dismissed = await _bargainAlertService.DismissAsync(id, cancellationToken);

      // Idempotent: a second dismiss on a non-active row returns 204.
      // 404 only when the row genuinely doesn't exist would require an
      // extra read. Not worth the trip — the toast won't ever fire
      // dismiss against a missing id in practice.
      return NoContent();
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to dismiss bargain alert {AlertId}.", id);
      return StatusCode(StatusCodes.Status500InternalServerError, new
      {
        message = "An error occurred while dismissing the bargain alert."
      });
    }
  }

  private bool TryGetAuthenticatedPlayerId(out long playerId)
  {
    var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
    return long.TryParse(sub, out playerId);
  }
}
