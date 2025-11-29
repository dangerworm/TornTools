using FluentValidation;
using TornTools.Core.Models.InputModels;

namespace TornTools.Api.Validation;

public class UserDetailsInputModelValidator : AbstractValidator<UserDetailsInputModel>
{
    public UserDetailsInputModelValidator()
    {
        RuleFor(user => user.ApiKey)
            .NotEmpty().WithMessage("API key is required.")
            .MinimumLength(8).WithMessage("API key must be at least 8 characters long.")
            .MaximumLength(128).WithMessage("API key must be 128 characters or fewer.");

        RuleFor(user => user.UserProfile)
            .NotNull().WithMessage("User profile is required.")
            .SetValidator(new UserProfileInputModelValidator());
    }
}
