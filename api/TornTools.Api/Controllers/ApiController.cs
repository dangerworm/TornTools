using Microsoft.AspNetCore.Mvc;
using TornTools.Application.Interfaces;

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
            var message = "An error occurred while retrieving items.";

            _logger.LogError(ex, message);

            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message,
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
                return NotFound("No items found.");

            return Ok(listings);
        }
        catch (Exception ex)
        {
            var message = "An error occurred while retrieving listings.";

            _logger.LogError(ex, message);
            
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message,
                details = ex.Message
            });
        }
    }
}
