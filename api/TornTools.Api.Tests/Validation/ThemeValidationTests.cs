using FluentValidation.TestHelper;
using TornTools.Api.Validation;
using TornTools.Core.Models.InputModels;
using Xunit;

namespace TornTools.Api.Tests.Validation;

public class ThemeValidationTests
{
    [Fact]
    public void Theme_Should_Fail_With_Invalid_Color_Format()
    {
        var validator = new ThemeInputModelValidator();
        var model = CreateValidTheme();
        model.PrimaryColor = "123456";

        var result = validator.TestValidate(model);

        result.ShouldHaveValidationErrorFor(theme => theme.PrimaryColor)
            .WithErrorMessage("Primary color must be a valid hex color (e.g. #RRGGBB or #RRGGBBAA).");
    }

    [Fact]
    public void Theme_Should_Fail_When_Id_Is_Negative()
    {
        var validator = new ThemeInputModelValidator();
        var model = CreateValidTheme();
        model.Id = -2;

        var result = validator.TestValidate(model);

        result.ShouldHaveValidationErrorFor(theme => theme.Id)
            .WithErrorMessage("Theme id must be a positive number when provided.");
    }

    [Fact]
    public void Theme_Should_Pass_With_Valid_Data()
    {
        var validator = new ThemeInputModelValidator();
        var model = CreateValidTheme();

        var result = validator.TestValidate(model);

        result.ShouldNotHaveAnyValidationErrors();
    }

    private static ThemeInputModel CreateValidTheme() => new()
    {
        Id = null,
        UserId = 10,
        Name = "My Theme",
        Mode = "dark",
        PrimaryColor = "#112233",
        SecondaryColor = "#AABBCCDD"
    };
}
