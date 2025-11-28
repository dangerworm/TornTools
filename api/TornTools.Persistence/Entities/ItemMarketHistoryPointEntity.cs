namespace TornTools.Persistence.Entities;

public sealed class ItemMarketHistoryPointEntity
{
    public required DateTime Bucket { get; init; }
    public decimal? AveragePrice { get; set; }
    public required int Count { get; init; }
}