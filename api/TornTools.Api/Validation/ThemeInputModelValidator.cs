using FluentValidation;
using TornTools.Core.Models.InputModels;

namespace TornTools.Api.Validation;

public class ThemeInputModelValidator : AbstractValidator<ThemeInputModel>
{
    private const string HexColorPattern = "^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$";

    public ThemeInputModelValidator()
    {
        RuleFor(theme => theme.Id)
            .GreaterThan(0)
            .When(theme => theme.Id.HasValue)
            .WithMessage("Theme id must be a positive number when provided.");

        RuleFor(theme => theme.UserId)
            .GreaterThan(0)
            .When(theme => theme.UserId.HasValue)
            .WithMessage("User id must be a positive number when provided.");

        RuleFor(theme => theme.Name)
            .NotEmpty().WithMessage("Theme name is required.")
            .MaximumLength(100).WithMessage("Theme name must be 100 characters or fewer.");

        RuleFor(theme => theme.Mode)
            .NotEmpty().WithMessage("Theme mode is required.")
            .MaximumLength(20).WithMessage("Theme mode must be 20 characters or fewer.");

        RuleFor(theme => theme.PrimaryColor)
            .NotEmpty().WithMessage("Primary color is required.")
            .Matches(HexColorPattern)
            .WithMessage("Primary color must be a valid hex color (e.g. #RRGGBB or #RRGGBBAA).");

        RuleFor(theme => theme.SecondaryColor)
            .NotEmpty().WithMessage("Secondary color is required.")
            .Matches(HexColorPattern)
            .WithMessage("Secondary color must be a valid hex color (e.g. #RRGGBB or #RRGGBBAA).");
    }
}
