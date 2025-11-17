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
                message = string.Format(ErrorMessage, "items"),
                details = ex.Message
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
            var listings = await _databaseService.GetProfitableListings(CancellationToken.None);

            if (listings == null || !listings.Any())
                return NotFound("No listings found.");

            return Ok(listings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving {EntityType}.", "listings");
            
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = string.Format(ErrorMessage, "listings"),
                details = ex.Message
            });
        }
    }

    [HttpPost(Name = "PostUserDetails")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> PostUserDetails([FromBody] UserDetailsInputModel userDetails)
    {
        try
        {
            var user = await _databaseService.UpsertUserDetailsAsync(userDetails, CancellationToken.None);
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while processing user details.");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "An error occurred while processing user details.",
                details = ex.Message
            });
        }
    }
}
