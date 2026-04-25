namespace TornTools.Core.Configurations;

// Drew-only v1: a single hardcoded list of authorised Torn player IDs.
// The future subscriber-ledger extension replaces the list lookup with
// a 30-day-window query against bargain alerts events; the call site
// (IBargainAlertAuthService.IsAuthorised) stays the same.
public class BargainAlertsConfiguration
{
  public List<long> AuthorisedPlayerIds { get; set; } = [];

  // Snipe-loop bound: max consecutive interleaved re-polls of the same
  // hot item before the processor falls back to normal queue cadence.
  // Keeps a persistently-cheap-relisted item from starving everything
  // else. Dial down if the queue feels starved in prod.
  public int MaxInterleaves { get; set; } = 50;
}
