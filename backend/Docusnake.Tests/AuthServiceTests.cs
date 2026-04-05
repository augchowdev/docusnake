using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Docusnake.API.Data;
using Docusnake.API.DTOs;
using Docusnake.API.Services;
using Xunit;

namespace Docusnake.Tests;

public class AuthServiceTests
{
    private AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    private IConfiguration CreateConfig()
    {
        var config = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "TestSuperSecretJwtKey2024!@#$%^&*()",
            ["Jwt:Issuer"] = "TestIssuer",
            ["Jwt:Audience"] = "TestAudience"
        };
        return new ConfigurationBuilder().AddInMemoryCollection(config).Build();
    }

    [Fact]
    public async Task Register_NewUser_ReturnsToken()
    {
        using var context = CreateContext(nameof(Register_NewUser_ReturnsToken));
        var service = new AuthService(context, CreateConfig());

        var result = await service.RegisterAsync(new RegisterRequest
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "password123"
        });

        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.Equal("testuser", result.Username);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsNull()
    {
        using var context = CreateContext(nameof(Register_DuplicateEmail_ReturnsNull));
        var service = new AuthService(context, CreateConfig());

        await service.RegisterAsync(new RegisterRequest
        {
            Username = "user1",
            Email = "dup@example.com",
            Password = "password123"
        });

        var result = await service.RegisterAsync(new RegisterRequest
        {
            Username = "user2",
            Email = "dup@example.com",
            Password = "password456"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        using var context = CreateContext(nameof(Login_ValidCredentials_ReturnsToken));
        var service = new AuthService(context, CreateConfig());

        await service.RegisterAsync(new RegisterRequest
        {
            Username = "loginuser",
            Email = "login@example.com",
            Password = "mypassword"
        });

        var result = await service.LoginAsync(new LoginRequest
        {
            Email = "login@example.com",
            Password = "mypassword"
        });

        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
    }

    [Fact]
    public async Task Login_InvalidPassword_ReturnsNull()
    {
        using var context = CreateContext(nameof(Login_InvalidPassword_ReturnsNull));
        var service = new AuthService(context, CreateConfig());

        await service.RegisterAsync(new RegisterRequest
        {
            Username = "loginuser2",
            Email = "login2@example.com",
            Password = "correctpassword"
        });

        var result = await service.LoginAsync(new LoginRequest
        {
            Email = "login2@example.com",
            Password = "wrongpassword"
        });

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_NonExistentUser_ReturnsNull()
    {
        using var context = CreateContext(nameof(Login_NonExistentUser_ReturnsNull));
        var service = new AuthService(context, CreateConfig());

        var result = await service.LoginAsync(new LoginRequest
        {
            Email = "nobody@example.com",
            Password = "anypassword"
        });

        Assert.Null(result);
    }
}
