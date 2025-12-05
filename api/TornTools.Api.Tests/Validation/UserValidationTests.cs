using FluentValidation.TestHelper;
using TornTools.Api.Validation;
using TornTools.Core.Models.InputModels;
using Xunit;

namespace TornTools.Api.Tests.Validation;

public class UserValidationTests
{
    [Fact]
    public void UserDetails_Should_Fail_When_ApiKey_TooShort()
    {
        var validator = new UserDetailsInputModelValidator();
        var model = new UserDetailsInputModel
        {
            ApiKey = "short",
            UserProfile = CreateValidProfile()
        };

        var result = validator.TestValidate(model);

        result.ShouldHaveValidationErrorFor(user => user.ApiKey)
            .WithErrorMessage("API key must be at least 8 characters long.");
    }

    [Fact]
    public void UserDetails_Should_Fail_When_Profile_Invalid()
    {
        var validator = new UserDetailsInputModelValidator();
        var model = new UserDetailsInputModel
        {
            ApiKey = "valid-api-key",
            UserProfile = new UserProfileInputModel
            {
                Id = -1,
                Level = 0,
                Name = string.Empty,
                Gender = ""
            }
        };

        var result = validator.TestValidate(model);

        result.ShouldHaveValidationErrorFor("UserProfile.Id")
            .WithErrorMessage("User profile id must be a positive number.");
        result.ShouldHaveValidationErrorFor("UserProfile.Level")
            .WithErrorMessage("Level must be at least 1.");
        result.ShouldHaveValidationErrorFor("UserProfile.Name")
            .WithErrorMessage("User name is required.");
        result.ShouldHaveValidationErrorFor("UserProfile.Gender")
            .WithErrorMessage("Gender is required.");
    }

    [Fact]
    public void UserDetails_Should_Pass_With_Valid_Data()
    {
        var validator = new UserDetailsInputModelValidator();
        var model = new UserDetailsInputModel
        {
            ApiKey = new string('a', 12),
            UserProfile = CreateValidProfile()
        };

        var result = validator.TestValidate(model);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Favourite_Should_Fail_For_NonPositive_Ids()
    {
        var validator = new UserFavouriteInputModelValidator();
        var model = new UserFavouriteInputModel
        {
            UserId = 0,
            ItemId = -5,
            Add = true
        };

        var result = validator.TestValidate(model);

        result.ShouldHaveValidationErrorFor(fav => fav.UserId)
            .WithErrorMessage("User id must be a positive number.");
        result.ShouldHaveValidationErrorFor(fav => fav.ItemId)
            .WithErrorMessage("Item id must be a positive number.");
    }

    [Fact]
    public void Favourite_Should_Pass_With_Valid_Ids()
    {
        var validator = new UserFavouriteInputModelValidator();
        var model = new UserFavouriteInputModel
        {
            UserId = 1,
            ItemId = 100,
            Add = false
        };

        var result = validator.TestValidate(model);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void UserThemeSelection_Should_Fail_With_Invalid_Ids()
    {
        var validator = new UserThemeSelectionInputModelValidator();
        var model = new UserThemeSelectionInputModel
        {
            UserId = -1,
            ThemeId = 0
        };

        var result = validator.TestValidate(model);

        result.ShouldHaveValidationErrorFor(selection => selection.UserId)
            .WithErrorMessage("User id must be a positive number.");
        result.ShouldHaveValidationErrorFor(selection => selection.ThemeId)
            .WithErrorMessage("Theme id must be a positive number when provided.");
    }

    [Fact]
    public void UserThemeSelection_Should_Pass_With_Valid_Ids()
    {
        var validator = new UserThemeSelectionInputModelValidator();
        var model = new UserThemeSelectionInputModel
        {
            UserId = 10,
            ThemeId = 5
        };

        var result = validator.TestValidate(model);

        result.ShouldNotHaveAnyValidationErrors();
    }

    private static UserProfileInputModel CreateValidProfile() => new()
    {
        Id = 123,
        Level = 10,
        Name = "Tester",
        Gender = "Non-binary"
    };
}
