using FluentValidation;
using TornTools.Core.Models.InputModels;

namespace TornTools.Api.Validation;

public class UserThemeSelectionInputModelValidator : AbstractValidator<UserThemeSelectionInputModel>
{
    public UserThemeSelectionInputModelValidator()
    {
        RuleFor(selection => selection.UserId)
            .GreaterThan(0)
            .WithMessage("User id must be a positive number.");

        RuleFor(selection => selection.ThemeId)
            .GreaterThan(0)
            .When(selection => selection.ThemeId.HasValue)
            .WithMessage("Theme id must be a positive number when provided.");
    }
}
