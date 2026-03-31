namespace TornTools.Core.DataTransferObjects;

public class ItemHistoryPointDto
{
  public required DateTimeOffset Timestamp { get; set; }
  public long? Price { get; set; }
  public int? Velocity { get; set; }
}
