using AwesomeAssertions;
using NSubstitute;
using Template.Library;
using Xunit;

namespace Template.Library.Tests;

public sealed class Class1Tests
{
    [Fact]
    public void CanCreateLibraryType()
    {
        var instance = new Class1();

        instance.Should().NotBeNull();
    }

    [Fact]
    public void SupportsSubstitutesInTests()
    {
        var dependency = Substitute.For<IValueProvider>();
        dependency.GetValue().Returns("expected");

        dependency.GetValue().Should().Be("expected");
    }

    public interface IValueProvider
    {
        string GetValue();
    }
}
