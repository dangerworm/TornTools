using System.ComponentModel.DataAnnotations;

namespace TornTools.Core.Models.InputModels;

public class UserDetailsInputModel
{
  [Required]
  [StringLength(16, MinimumLength = 16, ErrorMessage = "Torn API keys are exactly 16 characters.")]
  public required string ApiKey { get; set; }

  [Range(1, 4)]
  public int AccessLevel { get; set; } = 1;

  [Required]
  public required UserProfileInputModel UserProfile { get; set; }
}
