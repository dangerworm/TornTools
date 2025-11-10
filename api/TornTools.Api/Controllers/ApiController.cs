using Microsoft.AspNetCore.Mvc;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ApiController(
    ILogger<ApiController> logger,
    IDatabaseService databaseService
) : ControllerBase
{
    private readonly ILogger<ApiController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IDatabaseService _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));

    [HttpGet(Name = "GetProfitableListings")]
    public async Task<IEnumerable<ProfitableListingDto>> GetProfitableListings()
    {
        return await _databaseService.GetProfitableListings(CancellationToken.None);
    }
}
