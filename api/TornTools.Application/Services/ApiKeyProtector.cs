using System.Security.Cryptography;
using System.Text;
using TornTools.Core.Configurations;
using TornTools.Core.Interfaces;

namespace TornTools.Application.Services;

// AES-GCM encryption of Torn API keys at rest. Payload layout:
//   [1 byte version][12 byte nonce][16 byte GCM tag][ciphertext]
//
// The version byte lets us rotate keys without re-encrypting old rows up-
// front: new writes use CurrentVersion, old rows stay decryptable via
// whichever Keys[version] encrypted them. A re-encryption pass can promote
// v1 rows to v2 in the background after a rotation.
public class ApiKeyProtector : IApiKeyProtector
{
  private const int NonceSize = 12;
  private const int TagSize = 16;
  private const int KeySize = 32; // AES-256
  private const int VersionPrefixSize = 1;

  private readonly byte _currentVersion;
  private readonly Dictionary<byte, byte[]> _keys;

  public ApiKeyProtector(TornKeyEncryptionConfiguration config)
  {
    if (config.Keys.Count == 0)
    {
      throw new InvalidOperationException(
          "TornKeyEncryption:Keys is empty. At least one base64-encoded 32-byte AES key must be configured.");
    }

    _keys = new Dictionary<byte, byte[]>(config.Keys.Count);
    foreach (var (versionString, base64) in config.Keys)
    {
      if (!byte.TryParse(versionString, out var version))
      {
        throw new InvalidOperationException(
            $"TornKeyEncryption:Keys key '{versionString}' is not a valid byte (0-255).");
      }

      byte[] keyBytes;
      try
      {
        keyBytes = Convert.FromBase64String(base64);
      }
      catch (FormatException ex)
      {
        throw new InvalidOperationException(
            $"TornKeyEncryption:Keys:{versionString} is not valid base64.", ex);
      }

      if (keyBytes.Length != KeySize)
      {
        throw new InvalidOperationException(
            $"TornKeyEncryption:Keys:{versionString} must be a base64-encoded {KeySize}-byte key (got {keyBytes.Length} bytes).");
      }

      _keys[version] = keyBytes;
    }

    if (!byte.TryParse(config.CurrentVersion, out var currentVersion))
    {
      throw new InvalidOperationException(
          $"TornKeyEncryption:CurrentVersion '{config.CurrentVersion}' is not a valid byte (0-255).");
    }

    if (!_keys.ContainsKey(currentVersion))
    {
      throw new InvalidOperationException(
          $"TornKeyEncryption:CurrentVersion is {currentVersion} but no Keys entry matches that version.");
    }

    _currentVersion = currentVersion;
  }

  public byte[] Protect(string plaintext)
  {
    var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
    var ciphertext = new byte[plaintextBytes.Length];
    var nonce = RandomNumberGenerator.GetBytes(NonceSize);
    var tag = new byte[TagSize];

    using var aes = new AesGcm(_keys[_currentVersion], TagSize);
    aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

    var output = new byte[VersionPrefixSize + NonceSize + TagSize + ciphertext.Length];
    output[0] = _currentVersion;
    Buffer.BlockCopy(nonce, 0, output, VersionPrefixSize, NonceSize);
    Buffer.BlockCopy(tag, 0, output, VersionPrefixSize + NonceSize, TagSize);
    Buffer.BlockCopy(ciphertext, 0, output, VersionPrefixSize + NonceSize + TagSize, ciphertext.Length);

    return output;
  }

  public string Unprotect(byte[] payload)
  {
    if (payload.Length < VersionPrefixSize + NonceSize + TagSize)
    {
      throw new CryptographicException(
          $"Encrypted payload is too short ({payload.Length} bytes; minimum {VersionPrefixSize + NonceSize + TagSize}).");
    }

    var version = payload[0];
    if (!_keys.TryGetValue(version, out var key))
    {
      throw new CryptographicException(
          $"No key configured for version {version}. Add TornKeyEncryption:Keys:{version} to decrypt this row.");
    }

    var nonce = new byte[NonceSize];
    var tag = new byte[TagSize];
    var ciphertextLength = payload.Length - VersionPrefixSize - NonceSize - TagSize;
    var ciphertext = new byte[ciphertextLength];

    Buffer.BlockCopy(payload, VersionPrefixSize, nonce, 0, NonceSize);
    Buffer.BlockCopy(payload, VersionPrefixSize + NonceSize, tag, 0, TagSize);
    Buffer.BlockCopy(payload, VersionPrefixSize + NonceSize + TagSize, ciphertext, 0, ciphertextLength);

    var plaintext = new byte[ciphertextLength];
    using var aes = new AesGcm(key, TagSize);
    aes.Decrypt(nonce, ciphertext, tag, plaintext);

    return Encoding.UTF8.GetString(plaintext);
  }
}
