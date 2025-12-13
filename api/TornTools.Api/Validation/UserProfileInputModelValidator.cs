using FluentValidation;
using TornTools.Core.Models.InputModels;

namespace TornTools.Api.Validation;

public class UserProfileInputModelValidator : AbstractValidator<UserProfileInputModel>
{
    public UserProfileInputModelValidator()
    {
        RuleFor(profile => profile.Id)
            .GreaterThan(0)
            .WithMessage("User profile id must be a positive number.");

        RuleFor(profile => profile.Name)
            .NotEmpty().WithMessage("User name is required.")
            .MaximumLength(100).WithMessage("User name must be 100 characters or fewer.");

        RuleFor(profile => profile.Level)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Level must be at least 1.");

        RuleFor(profile => profile.Gender)
            .NotEmpty().WithMessage("Gender is required.")
            .MaximumLength(20).WithMessage("Gender must be 20 characters or fewer.");
    }
}
