using Microsoft.Extensions.Logging;
using Microsoft.Playwright;
using TornTools.Application.Interfaces;
using TornTools.Application.Playwright;
using TornTools.Core.Configurations;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public class Weav3rApiCaller(
    ILogger<Weav3rApiCaller> logger,
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory,
    PlaywrightSingleton playwright,
    Weav3rApiCallerConfiguration options
) : ApiCaller<Weav3rApiCaller>(logger, databaseService, httpClientFactory), IApiCaller
{
  private readonly Weav3rApiCallerConfiguration _options = options ?? throw new ArgumentNullException(nameof(options));

  public override IEnumerable<ApiCallType> CallTypes =>
  [
      ApiCallType.Weav3rBazaarListings
  ];

  protected override string ClientName => Weav3rApiConstants.ClientName;

  protected override async Task<string?> Fetch(
      HttpClient client,
      HttpRequestMessage requestMessage,
      CancellationToken stoppingToken)
  {
    if (requestMessage.RequestUri is null)
    {
      return null;
    }

    var context = await playwright.Browser.NewContextAsync(new BrowserNewContextOptions
    {
      // Set a realistic UA if you want: UserAgent = "Mozilla/5.0 (Windows NT 10.0; ...)"
      IgnoreHTTPSErrors = true
    });

    var page = await context.NewPageAsync();
    await page.GotoAsync(requestMessage.RequestUri.AbsoluteUri);
    var content = await page.TextContentAsync("pre");

    await page.CloseAsync();
    await context.CloseAsync();

    return content;
  }

  Task<bool> IApiCaller.CallAsync(QueueItemDto item, IApiCallHandler handler, CancellationToken ct)
  {
    return CallAsync(item, handler, ct);
  }
}
