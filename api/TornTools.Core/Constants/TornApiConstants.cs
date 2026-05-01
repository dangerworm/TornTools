namespace TornTools.Core.Constants;

public static class TornApiConstants
{
  public const string ClientName = "torn-api-caller";

  public const string Items = "https://api.torn.com/v2/torn/?selections=items";
  public const string ItemListings = "https://api.torn.com/v2/market/{0}/itemmarket?offset=0";
  public const string KeyInfo = "https://api.torn.com/v2/key/info";
  public const string UserBasic = "https://api.torn.com/v2/user/basic";
  public const string UserInventory = "https://api.torn.com/v2/user/inventory";

  // v1 endpoint — the live Torn shoplifting page calls this URL directly.
  // The v2 surface for shoplifting hasn't been verified at parity, so we
  // mirror what the page itself uses.
  public const string Shoplifting = "https://api.torn.com/torn/?selections=shoplifting";
}
