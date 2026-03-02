using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;

namespace TornTools.Application.Observability;

public class MetricsCollector(ILogger<MetricsCollector> logger) : IMetricsCollector
{
    private readonly ILogger<MetricsCollector> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly OperationAccumulator _requestAccumulator = new();
    private readonly ConcurrentDictionary<string, OperationAccumulator> _requestsByRoute = new();
    private readonly ConcurrentDictionary<string, OperationAccumulator> _databaseOperations = new();
    private readonly ConcurrentDictionary<string, OperationAccumulator> _externalOperations = new();

    public void RecordRequest(string route, int statusCode, TimeSpan duration)
    {
        var isError = statusCode >= 500;
        _requestAccumulator.Record(duration, isError);
        _requestsByRoute.GetOrAdd(route, _ => new OperationAccumulator()).Record(duration, isError);
    }

    public void RecordDatabaseCall(string operation, TimeSpan duration, bool success)
    {
        _databaseOperations
            .GetOrAdd(operation, _ => new OperationAccumulator())
            .Record(duration, !success);
    }

    public void RecordExternalCall(string target, TimeSpan duration, bool success)
    {
        _externalOperations
            .GetOrAdd(target, _ => new OperationAccumulator())
            .Record(duration, !success);
    }

    public MetricsSnapshot CreateSnapshot()
    {
        _logger.LogDebug("Creating metrics snapshot.");

        var requestSnapshot = new RequestMetricsSnapshot(
            _requestAccumulator.ToSnapshot(),
            _requestsByRoute.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.ToSnapshot()
            )
        );

        return new MetricsSnapshot(
            requestSnapshot,
            _databaseOperations.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.ToSnapshot()),
            _externalOperations.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.ToSnapshot())
        );
    }

    private sealed class OperationAccumulator
    {
        private long _total;
        private long _errors;
        private long _totalTicks;
        private long _maxTicks;

        public void Record(TimeSpan duration, bool isError)
        {
            Interlocked.Increment(ref _total);
            if (isError)
            {
                Interlocked.Increment(ref _errors);
            }

            Interlocked.Add(ref _totalTicks, duration.Ticks);

            var durationTicks = duration.Ticks;
            long initialMaxTicks;
            do
            {
                initialMaxTicks = _maxTicks;
                if (durationTicks <= initialMaxTicks)
                {
                    break;
                }
            } while (Interlocked.CompareExchange(ref _maxTicks, durationTicks, initialMaxTicks) != initialMaxTicks);
        }

        public OperationMetricsSnapshot ToSnapshot()
        {
            var total = Interlocked.Read(ref _total);
            var totalTicks = Interlocked.Read(ref _totalTicks);
            var maxTicks = Interlocked.Read(ref _maxTicks);

            var averageMs = total == 0
                ? 0
                : TimeSpan.FromTicks(totalTicks / total).TotalMilliseconds;

            return new OperationMetricsSnapshot(
                Total: total,
                Errors: Interlocked.Read(ref _errors),
                AverageMs: Math.Round(averageMs, 2),
                MaxMs: Math.Round(TimeSpan.FromTicks(maxTicks).TotalMilliseconds, 2)
            );
        }
    }
}
