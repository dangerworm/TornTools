using TornTools.Core.Enums;

namespace TornTools.Core.DataTransferObjects;

public class ItemChangeLogSummaryDto
{
  public required int ItemId { get; set; }
  public required Source Source { get; set; }
  public required DateTimeOffset BucketStart { get; set; }
  public required int ChangeCount { get; set; }
  public required long SumPrice { get; set; }
  public required long MinPrice { get; set; }
  public required long MaxPrice { get; set; }
}
