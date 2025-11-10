namespace TornTools.Core.Constants;

public class ApiConstants
{
    public const int MaxApiCallAttempts = 5;

    public const int NumberOfListingsToStorePerItem = 50;

    // Used in development: limits the number of items we have in the database
    // for testing purposes. e.g. NumberOfItems = 2 uses only the first two items
    // from the 'all items' Torn API.
    public const int MaxNumberOfItemsToProcess = int.MaxValue;
}
