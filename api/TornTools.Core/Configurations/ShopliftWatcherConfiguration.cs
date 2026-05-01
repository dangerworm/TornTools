namespace TornTools.Core.Configurations;

public class ShopliftWatcherConfiguration
{
  public bool Enabled { get; set; } = false;
  public int PollIntervalSeconds { get; set; } = 30;
  public string PublicApiKey { get; set; } = string.Empty;
  public string DiscordWebhookUrl { get; set; } = string.Empty;
  public string? MentionRoleId { get; set; }
}
