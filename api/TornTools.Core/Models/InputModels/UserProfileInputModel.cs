using System.ComponentModel.DataAnnotations;

namespace TornTools.Core.Models.InputModels;

public class UserProfileInputModel
{
  [Required]
  public required long Id { get; set; }

  [Required]
  [StringLength(50)]
  public required string Name { get; set; }

  [Required]
  [Range(1, int.MaxValue, ErrorMessage = "Level must be at least 1.")]
  public required int Level { get; set; }

  [Required]
  [StringLength(20)]
  public required string Gender { get; set; }
}
