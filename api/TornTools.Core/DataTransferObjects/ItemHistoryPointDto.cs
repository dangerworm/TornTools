namespace TornTools.Core.DataTransferObjects;

public class ItemHistoryPointDto
{
    public required DateTime Timestamp { get; set; }
    public long? Price { get; set; }
    public int? Velocity { get; set; }
}
