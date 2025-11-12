namespace TornTools.Core.Constants;

public static class QueueProcessorConstants
{
    // 60 seconds / 100 calls per minute max = 0.6 seconds per call
    public const double SecondsPerQueueWorkerIteration = 0.6;

    public const int SecondsToWaitOnEmptyQueue = 5;
}
