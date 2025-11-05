using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Models;

namespace TornTools.Application.Handlers;
public class ItemsHandler(IDatabaseService databaseService, ILogger<ItemsHandler> logger)
{
    private readonly IDatabaseService _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
    private readonly ILogger<ItemsHandler> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task HandleResponse(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        var items = JsonSerializer.Deserialize<ItemsPayload>(content);

        // Implementation goes here
        return;
    }
}
