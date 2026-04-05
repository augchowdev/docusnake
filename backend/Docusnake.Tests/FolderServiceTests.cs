using Microsoft.EntityFrameworkCore;
using Docusnake.API.Data;
using Docusnake.API.DTOs;
using Docusnake.API.Models;
using Docusnake.API.Services;
using Xunit;

namespace Docusnake.Tests;

public class FolderServiceTests
{
    private AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    private async Task<Guid> CreateUserAsync(AppDbContext context)
    {
        var user = new User
        {
            Username = "folderuser",
            Email = "folder@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password")
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user.Id;
    }

    [Fact]
    public async Task CreateFolder_ReturnsCreatedFolder()
    {
        using var context = CreateContext(nameof(CreateFolder_ReturnsCreatedFolder));
        var userId = await CreateUserAsync(context);
        var service = new FolderService(context);

        var folder = await service.CreateFolderAsync(userId, new CreateFolderRequest { Name = "Work" });

        Assert.NotNull(folder);
        Assert.Equal("Work", folder.Name);
        Assert.Null(folder.ParentFolderId);
    }

    [Fact]
    public async Task CreateSubFolder_SetsParentFolderId()
    {
        using var context = CreateContext(nameof(CreateSubFolder_SetsParentFolderId));
        var userId = await CreateUserAsync(context);
        var service = new FolderService(context);

        var parent = await service.CreateFolderAsync(userId, new CreateFolderRequest { Name = "Parent" });
        var child = await service.CreateFolderAsync(userId, new CreateFolderRequest
        {
            Name = "Child",
            ParentFolderId = parent.Id
        });

        Assert.Equal(parent.Id, child.ParentFolderId);
    }

    [Fact]
    public async Task GetRootFolders_ReturnsOnlyRootFolders()
    {
        using var context = CreateContext(nameof(GetRootFolders_ReturnsOnlyRootFolders));
        var userId = await CreateUserAsync(context);
        var service = new FolderService(context);

        var root1 = await service.CreateFolderAsync(userId, new CreateFolderRequest { Name = "Root1" });
        var root2 = await service.CreateFolderAsync(userId, new CreateFolderRequest { Name = "Root2" });
        await service.CreateFolderAsync(userId, new CreateFolderRequest { Name = "Sub", ParentFolderId = root1.Id });

        var roots = await service.GetRootFoldersAsync(userId);

        Assert.Equal(2, roots.Count);
        Assert.All(roots, f => Assert.Null(f.ParentFolderId));
    }

    [Fact]
    public async Task DeleteFolder_ExistingFolder_ReturnsTrue()
    {
        using var context = CreateContext(nameof(DeleteFolder_ExistingFolder_ReturnsTrue));
        var userId = await CreateUserAsync(context);
        var service = new FolderService(context);

        var folder = await service.CreateFolderAsync(userId, new CreateFolderRequest { Name = "ToDelete" });
        var result = await service.DeleteFolderAsync(folder.Id, userId);

        Assert.True(result);
    }

    [Fact]
    public async Task DeleteFolder_NonExisting_ReturnsFalse()
    {
        using var context = CreateContext(nameof(DeleteFolder_NonExisting_ReturnsFalse));
        var userId = await CreateUserAsync(context);
        var service = new FolderService(context);

        var result = await service.DeleteFolderAsync(Guid.NewGuid(), userId);

        Assert.False(result);
    }

    [Fact]
    public async Task UpdateFolder_CircularReference_ReturnsNull()
    {
        using var context = CreateContext(nameof(UpdateFolder_CircularReference_ReturnsNull));
        var userId = await CreateUserAsync(context);
        var service = new FolderService(context);

        var parent = await service.CreateFolderAsync(userId, new CreateFolderRequest { Name = "Parent" });
        var child = await service.CreateFolderAsync(userId, new CreateFolderRequest
        {
            Name = "Child",
            ParentFolderId = parent.Id
        });

        // Try to make parent a child of its own child (circular reference)
        var result = await service.UpdateFolderAsync(parent.Id, userId, new UpdateFolderRequest
        {
            Name = "Parent",
            ParentFolderId = child.Id
        });

        Assert.Null(result);
    }
}
