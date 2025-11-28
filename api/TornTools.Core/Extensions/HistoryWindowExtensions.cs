using System;
using System.Collections.Generic;
using TornTools.Core.Enums;

namespace TornTools.Core.Extensions;

public static class HistoryWindowExtensions
{
    private static readonly Dictionary<HistoryWindow, (TimeSpan Range, TimeSpan Bucket)> WindowConfigurations =
        new()
        {
            { HistoryWindow.Minutes30, (TimeSpan.FromMinutes(30), TimeSpan.FromMinutes(5)) },
            { HistoryWindow.Hour1, (TimeSpan.FromHours(1), TimeSpan.FromMinutes(5)) },
            { HistoryWindow.Hours4, (TimeSpan.FromHours(4), TimeSpan.FromMinutes(15)) },
            { HistoryWindow.Day1, (TimeSpan.FromDays(1), TimeSpan.FromHours(1)) },
            { HistoryWindow.Week1, (TimeSpan.FromDays(7), TimeSpan.FromHours(1)) },
            { HistoryWindow.Month1, (TimeSpan.FromDays(30), TimeSpan.FromHours(1)) },
            { HistoryWindow.Months3, (TimeSpan.FromDays(90), TimeSpan.FromDays(1)) },
            { HistoryWindow.Year1, (TimeSpan.FromDays(365), TimeSpan.FromDays(1)) }
        };

    public static HistoryWindow Default => HistoryWindow.Day1;

    public static (TimeSpan Range, TimeSpan Bucket) ToWindowConfiguration(this HistoryWindow window)
    {
        return WindowConfigurations.TryGetValue(window, out var config)
            ? config
            : WindowConfigurations[Default];
    }

    public static bool TryParse(string? value, out HistoryWindow window)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            window = Default;
            return true;
        }

        var normalized = value.Trim().ToLowerInvariant();

        switch (normalized)
        {
            case "30m":
                window = HistoryWindow.Minutes30;
                return true;
            case "1h":
                window = HistoryWindow.Hour1;
                return true;
            case "4h":
                window = HistoryWindow.Hours4;
                return true;
            case "day" or "1d":
                window = HistoryWindow.Day1;
                return true;
            case "week" or "1w":
                window = HistoryWindow.Week1;
                return true;
            case "month" or "1m":
                window = HistoryWindow.Month1;
                return true;
            case "3m":
                window = HistoryWindow.Months3;
                return true;
            case "year" or "1y":
                window = HistoryWindow.Year1;
                return true;
            default:
                if (Enum.TryParse(value, true, out HistoryWindow parsed))
                {
                    window = parsed;
                    return true;
                }

                window = Default;
                return false;
        }
    }
}
