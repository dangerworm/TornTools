namespace TornTools.Core.DataTransferObjects;

// Returned by IUserRepository.GetNextApiKeyAsync. Pairs the decrypted key
// with its owner so the caller can mark the key unavailable by user id on
// failure — without doing an equality lookup on plaintext, which wouldn't
// survive non-deterministic encryption at rest.
public record ApiKeyLeaseDto(long UserId, string ApiKey);
