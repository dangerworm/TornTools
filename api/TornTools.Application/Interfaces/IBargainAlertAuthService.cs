namespace TornTools.Application.Interfaces;

public interface IBargainAlertAuthService
{
  // Whether the given Torn player_id is authorised to receive bargain
  // alerts. v1 consults a config list; the future subscriber-ledger
  // extension replaces this with a 30-day query against received-Xanax
  // events.
  bool IsAuthorised(long playerId);
}
