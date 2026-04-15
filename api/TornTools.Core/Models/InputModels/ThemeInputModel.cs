using System.ComponentModel.DataAnnotations;

namespace TornTools.Core.Models.InputModels;

public class ThemeInputModel
{
  public long? Id { get; set; }
  public long? UserId { get; set; }

  [Required]
  [StringLength(50)]
  public required string Name { get; set; }

  [Required]
  [RegularExpression("^(light|dark)$", ErrorMessage = "Mode must be 'light' or 'dark'.")]
  public required string Mode { get; set; }

  [Required]
  [RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a 6-digit hex value (e.g. #1A2B3C).")]
  public required string PrimaryColor { get; set; }

  [Required]
  [RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "Color must be a 6-digit hex value (e.g. #1A2B3C).")]
  public required string SecondaryColor { get; set; }
}
