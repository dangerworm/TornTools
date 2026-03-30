namespace TornTools.Core.Constants;

public static class TornApiConstants
{
  public const string ClientName = "torn-api-caller";

  public const string Items = "https://api.torn.com/v2/torn/?selections=items";
  public const string ItemListings = "https://api.torn.com/v2/market/{0}/itemmarket?offset=0";
  public const string KeyInfo = "https://api.torn.com/v2/key/info";
  public const string UserBasic = "https://api.torn.com/v2/user/?selections=basic";
}
