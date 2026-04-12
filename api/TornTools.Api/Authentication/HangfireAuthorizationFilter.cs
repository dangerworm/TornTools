using Hangfire.Dashboard;
using System.Security.Claims;

namespace TornTools.Api.Authentication;

public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
  private const long AdminUserId = 3943900;

  public bool Authorize(DashboardContext context)
  {
    var httpContext = context.GetHttpContext();
    var sub = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
    return long.TryParse(sub, out var userId) && userId == AdminUserId;
  }
}
