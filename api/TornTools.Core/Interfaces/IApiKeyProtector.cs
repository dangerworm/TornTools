namespace TornTools.Core.Interfaces;

// The only surface that touches Torn API key plaintext/ciphertext. Callers
// receive plaintext strings to pass to Torn; ciphertext bytes are only
// handled by the persistence layer.
public interface IApiKeyProtector
{
  byte[] Protect(string plaintext);
  string Unprotect(byte[] payload);
}
