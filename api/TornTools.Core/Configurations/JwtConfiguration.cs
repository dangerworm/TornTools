namespace TornTools.Core.Configurations;

public class JwtConfiguration
{
  public string Secret { get; set; } = string.Empty;
  public string Issuer { get; set; } = "TornTools";
  public string Audience { get; set; } = "TornTools";
  public int ExpiryDays { get; set; } = 30;
}
