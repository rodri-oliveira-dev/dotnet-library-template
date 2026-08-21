using Template.Library;
using Xunit;

namespace Template.Library.Tests;

public sealed class Class1Tests
{
    [Fact]
    public void CanCreateLibraryType()
    {
        var instance = new Class1();

        Assert.NotNull(instance);
    }
}
