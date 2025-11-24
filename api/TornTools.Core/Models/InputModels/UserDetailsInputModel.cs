namespace TornTools.Core.Models.InputModels;

public class UserDetailsInputModel
{
    public required string ApiKey { get; set; }
    public required UserProfileInputModel UserProfile { get; set; }
}
