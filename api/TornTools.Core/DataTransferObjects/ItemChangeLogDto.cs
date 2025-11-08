using TornTools.Core.Enums;

namespace TornTools.Core.DataTransferObjects;

public class ItemChangeLogDto
{
    public Guid? Id { get; set; }
    public required int ItemId { get; set; }
    public required Source Source { get; set; }
    public required DateTime ChangeTime { get; set; }
    public required long NewPrice { get; set; }
}
