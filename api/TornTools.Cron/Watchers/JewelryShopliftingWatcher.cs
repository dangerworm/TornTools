using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TornTools.Core.Configurations;
using TornTools.Core.Constants;

namespace TornTools.Cron.Watchers;

/// <summary>
/// Polls the Torn shoplifting endpoint and pings a Discord webhook when the
/// Jewelry Store window opens (all cameras off AND guard gone). The window
/// gives a unique merit and only lasts a couple of minutes, hence the short
/// poll interval. State is held in-memory; on restart we either fire-with-
/// caveat (window already open) or silently seed state (window closed).
/// </summary>
public class JewelryShopliftingWatcher(
    IHttpClientFactory httpClientFactory,
    ILogger<JewelryShopliftingWatcher> logger,
    ShopliftWatcherConfiguration config
) : BackgroundService
{
  private const string JewelryStoreKey = "jewelry_store";

  private readonly IHttpClientFactory _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
  private readonly ILogger<JewelryShopliftingWatcher> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
  private readonly ShopliftWatcherConfiguration _config = config ?? throw new ArgumentNullException(nameof(config));

  // null = never observed; true/false = last observed availability.
  // Only updated on a successful poll + parse so transient failures
  // can't fire a spurious "now available" ping.
  private bool? _wasAvailable;

  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    if (!_config.Enabled)
    {
      _logger.LogInformation("{Watcher} is disabled. Not polling.", nameof(JewelryShopliftingWatcher));
      return;
    }

    if (string.IsNullOrWhiteSpace(_config.PublicApiKey))
    {
      _logger.LogError("{Watcher} is enabled but ShopliftWatcher:PublicApiKey is empty. Not polling.", nameof(JewelryShopliftingWatcher));
      return;
    }

    if (string.IsNullOrWhiteSpace(_config.DiscordWebhookUrl))
    {
      _logger.LogError("{Watcher} is enabled but ShopliftWatcher:DiscordWebhookUrl is empty. Not polling.", nameof(JewelryShopliftingWatcher));
      return;
    }

    var pollInterval = TimeSpan.FromSeconds(Math.Max(5, _config.PollIntervalSeconds));
    _logger.LogInformation("{Watcher} starting with poll interval {Interval}.", nameof(JewelryShopliftingWatcher), pollInterval);

    while (!stoppingToken.IsCancellationRequested)
    {
      try
      {
        await PollOnceAsync(stoppingToken);
      }
      catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
      {
        break;
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "{Watcher} unhandled exception in poll loop.", nameof(JewelryShopliftingWatcher));
      }

      try { await Task.Delay(pollInterval, stoppingToken); }
      catch (OperationCanceledException) { break; }
    }

    _logger.LogInformation("{Watcher} stopping.", nameof(JewelryShopliftingWatcher));
  }

  private async Task PollOnceAsync(CancellationToken ct)
  {
    bool isAvailable;
    try
    {
      isAvailable = await FetchJewelryAvailabilityAsync(ct);
    }
    catch (Exception ex)
    {
      _logger.LogWarning(ex, "{Watcher} poll failed — leaving state unchanged.", nameof(JewelryShopliftingWatcher));
      return;
    }

    var previous = _wasAvailable;
    _wasAvailable = isAvailable;

    if (previous is null)
    {
      // Cold start: only ping if the window is already open. Suppresses
      // a ping every restart when the store happens to be guarded.
      if (isAvailable)
      {
        await TryNotifyAsync(coldStart: true, ct);
      }
      return;
    }

    if (previous == false && isAvailable)
    {
      await TryNotifyAsync(coldStart: false, ct);
    }
  }

  private async Task<bool> FetchJewelryAvailabilityAsync(CancellationToken ct)
  {
    var client = _httpClientFactory.CreateClient();
    var url = $"{TornApiConstants.Shoplifting}&key={Uri.EscapeDataString(_config.PublicApiKey)}";

    using var response = await client.GetAsync(url, ct);
    response.EnsureSuccessStatusCode();

    var payload = await response.Content.ReadFromJsonAsync<ShopliftingResponse>(ct);
    if (payload?.Shoplifting is null || !payload.Shoplifting.TryGetValue(JewelryStoreKey, out var entries) || entries is null || entries.Count == 0)
    {
      // Treat structural surprises as a transient failure rather than
      // letting them flip state. Throwing forces the catch in PollOnceAsync.
      throw new InvalidOperationException(
          $"Shoplifting payload missing or empty for '{JewelryStoreKey}' key.");
    }

    // Available = every camera/guard entry has disabled=true.
    return entries.All(e => e.Disabled);
  }

  private async Task TryNotifyAsync(bool coldStart, CancellationToken ct)
  {
    string mention;
    string allowedMentions;
    if (!string.IsNullOrWhiteSpace(_config.MentionRoleId))
    {
      mention = $"<@&{_config.MentionRoleId}> ";
      allowedMentions = $"\"allowed_mentions\":{{\"roles\":[\"{_config.MentionRoleId}\"]}},";
    }
    else
    {
      mention = string.Empty;
      allowedMentions = string.Empty;
    }

    var body = coldStart
        ? $"{mention}💎 Jewelry Store is unguarded — go shoplift!\n_Note: the watcher just restarted, so the cameras/guards may already be back by the time you see this._"
        : $"{mention}💎 Jewelry Store is unguarded — go shoplift!";

    var json = $"{{{allowedMentions}\"content\":{JsonSerializer.Serialize(body)}}}";

    try
    {
      var client = _httpClientFactory.CreateClient();
      using var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
      using var response = await client.PostAsync(_config.DiscordWebhookUrl, content, ct);
      response.EnsureSuccessStatusCode();
      _logger.LogInformation("{Watcher} fired Discord notification (coldStart={ColdStart}).", nameof(JewelryShopliftingWatcher), coldStart);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "{Watcher} Discord webhook POST failed (coldStart={ColdStart}).", nameof(JewelryShopliftingWatcher), coldStart);
    }
  }

  private sealed class ShopliftingResponse
  {
    [JsonPropertyName("shoplifting")]
    public Dictionary<string, List<ShopliftingEntry>>? Shoplifting { get; set; }
  }

  private sealed class ShopliftingEntry
  {
    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("disabled")]
    public bool Disabled { get; set; }
  }
}
