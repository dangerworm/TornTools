namespace TornTools.Core.Helpers;

public static class ListHelper
{
    public static void Shuffle<T>(this IList<T> list)
    {
        int n = list.Count;
        while (n > 1)
        {
            int k = Random.Shared.Next(n--);
            (list[k], list[n]) = (list[n], list[k]);
        }
    }
}
