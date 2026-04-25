using TornTools.Application.Interfaces;
using TornTools.Core.Configurations;

namespace TornTools.Application.Services;

public class BargainAlertAuthService(
    BargainAlertsConfiguration configuration
) : IBargainAlertAuthService
{
  private readonly HashSet<long> _authorised = [.. configuration.AuthorisedPlayerIds];

  public bool IsAuthorised(long playerId) => _authorised.Contains(playerId);
}
