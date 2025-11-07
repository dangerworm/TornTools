namespace TornTools.Core.Configurations;

public class TornApiCallerConfiguration
{
    public required string ApiKey { get; set; }
    public required int MaxCallsPerMinute { get; set; }
}
