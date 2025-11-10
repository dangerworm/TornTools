namespace TornTools.Core.Constants;

public static class QueueProcessorConstants
{
    // 60 seconds / 100 calls per minute max = 0.6 seconds per call
    // Add a buffer to be safe
    public const double SecondsPerQueueWorkerIteration = 0.5;

    public const int SecondsToWaitOnEmptyQueue = 5;
}
