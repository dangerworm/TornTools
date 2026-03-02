namespace TornTools.Application.Interfaces;

public interface IMetricsCollector
{
    void RecordRequest(string route, int statusCode, TimeSpan duration);

    void RecordDatabaseCall(string operation, TimeSpan duration, bool success);

    void RecordExternalCall(string target, TimeSpan duration, bool success);

    MetricsSnapshot CreateSnapshot();
}

public record MetricsSnapshot(
    RequestMetricsSnapshot Requests,
    IReadOnlyDictionary<string, OperationMetricsSnapshot> Database,
    IReadOnlyDictionary<string, OperationMetricsSnapshot> External
);

public record RequestMetricsSnapshot(
    OperationMetricsSnapshot Aggregate,
    IReadOnlyDictionary<string, OperationMetricsSnapshot> ByRoute
);

public record OperationMetricsSnapshot(
    long Total,
    long Errors,
    double AverageMs,
    double MaxMs
);
