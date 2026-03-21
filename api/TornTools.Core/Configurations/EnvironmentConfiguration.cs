namespace TornTools.Core.Configurations;

public class EnvironmentConfiguration
{
  public required string EnvironmentName { get; set; }
  public required bool PopulateQueue { get; set; }
  public required bool RunQueueProcessor { get; set; }
}
