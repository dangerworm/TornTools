using Microsoft.Playwright;

namespace TornTools.Application.Playwright;

public class PlaywrightSingleton
{
    private static readonly Lazy<IPlaywright> _playwright = new(
       () => Microsoft.Playwright.Playwright.CreateAsync().GetAwaiter().GetResult()
   );

    public readonly IBrowser Browser;

    public PlaywrightSingleton()
    {
        Browser = _playwright.Value.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = false
        }).GetAwaiter().GetResult();
    }
}
