using Microsoft.Extensions.Logging;

namespace TornTools.Persistence.Repositories;
public abstract class RepositoryBase<TRepository>(
    ILogger<TRepository> logger,
    TornToolsDbContext dbContext
)
{
    protected readonly ILogger<TRepository> Logger = logger ?? throw new ArgumentNullException(nameof(logger));
    protected readonly TornToolsDbContext DbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
}
