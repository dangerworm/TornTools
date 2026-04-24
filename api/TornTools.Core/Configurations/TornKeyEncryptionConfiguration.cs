namespace TornTools.Core.Configurations;

// Configuration for the at-rest encryption of stored Torn API keys. Holds a
// dictionary of version → base64-encoded 32-byte AES-GCM keys, and the
// version used for new writes. Rotation: add a new Keys entry, bump
// CurrentVersion, deploy. Old rows stay decryptable until a re-encryption
// pass promotes them to the current version.
public class TornKeyEncryptionConfiguration
{
  public string CurrentVersion { get; set; } = "1";
  public Dictionary<string, string> Keys { get; set; } = [];
}
