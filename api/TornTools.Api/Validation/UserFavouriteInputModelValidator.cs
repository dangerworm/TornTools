using FluentValidation;
using TornTools.Core.Models.InputModels;

namespace TornTools.Api.Validation;

public class UserFavouriteInputModelValidator : AbstractValidator<UserFavouriteInputModel>
{
    public UserFavouriteInputModelValidator()
    {
        RuleFor(favourite => favourite.UserId)
            .GreaterThan(0)
            .WithMessage("User id must be a positive number.");

        RuleFor(favourite => favourite.ItemId)
            .GreaterThan(0)
            .WithMessage("Item id must be a positive number.");
    }
}
