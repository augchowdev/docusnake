using Microsoft.EntityFrameworkCore;
using Docusnake.API.Data;
using Docusnake.API.DTOs;
using Docusnake.API.Models;
using Docusnake.API.Services;
using Xunit;

namespace Docusnake.Tests;

public class DocumentServiceTests
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
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password")
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user.Id;
    }

    [Fact]
    public async Task CreateDocument_ReturnsCreatedDocument()
    {
        using var context = CreateContext(nameof(CreateDocument_ReturnsCreatedDocument));
        var userId = await CreateUserAsync(context);
        var service = new DocumentService(context);

        var doc = await service.CreateDocumentAsync(userId, new CreateDocumentRequest
        {
            Name = "Test Doc",
            ExtractedText = "Some text"
        });

        Assert.NotNull(doc);
        Assert.Equal("Test Doc", doc.Name);
        Assert.Equal("Some text", doc.ExtractedText);
    }

    [Fact]
    public async Task GetDocuments_ReturnsUserDocuments()
    {
        using var context = CreateContext(nameof(GetDocuments_ReturnsUserDocuments));
        var userId = await CreateUserAsync(context);
        var service = new DocumentService(context);

        await service.CreateDocumentAsync(userId, new CreateDocumentRequest { Name = "Doc1" });
        await service.CreateDocumentAsync(userId, new CreateDocumentRequest { Name = "Doc2" });

        var docs = await service.GetDocumentsAsync(userId, null);

        Assert.Equal(2, docs.Count);
    }

    [Fact]
    public async Task GetDocument_NotOwner_ReturnsNull()
    {
        using var context = CreateContext(nameof(GetDocument_NotOwner_ReturnsNull));
        var userId = await CreateUserAsync(context);
        var service = new DocumentService(context);

        var doc = await service.CreateDocumentAsync(userId, new CreateDocumentRequest { Name = "Private" });

        var result = await service.GetDocumentAsync(doc.Id, Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateDocument_ValidUpdate_ReturnsUpdated()
    {
        using var context = CreateContext(nameof(UpdateDocument_ValidUpdate_ReturnsUpdated));
        var userId = await CreateUserAsync(context);
        var service = new DocumentService(context);

        var doc = await service.CreateDocumentAsync(userId, new CreateDocumentRequest { Name = "Original" });
        var updated = await service.UpdateDocumentAsync(doc.Id, userId, new UpdateDocumentRequest
        {
            Name = "Updated",
            ExtractedText = "New text"
        });

        Assert.NotNull(updated);
        Assert.Equal("Updated", updated.Name);
        Assert.Equal("New text", updated.ExtractedText);
    }

    [Fact]
    public async Task DeleteDocument_ExistingDoc_ReturnsTrue()
    {
        using var context = CreateContext(nameof(DeleteDocument_ExistingDoc_ReturnsTrue));
        var userId = await CreateUserAsync(context);
        var service = new DocumentService(context);

        var doc = await service.CreateDocumentAsync(userId, new CreateDocumentRequest { Name = "ToDelete" });
        var result = await service.DeleteDocumentAsync(doc.Id, userId);

        Assert.True(result);
        Assert.Empty(await service.GetDocumentsAsync(userId, null));
    }

    [Fact]
    public async Task DeleteDocument_NonExisting_ReturnsFalse()
    {
        using var context = CreateContext(nameof(DeleteDocument_NonExisting_ReturnsFalse));
        var userId = await CreateUserAsync(context);
        var service = new DocumentService(context);

        var result = await service.DeleteDocumentAsync(Guid.NewGuid(), userId);

        Assert.False(result);
    }

    [Fact]
    public async Task ExtractData_WithText_PopulatesExtractedData()
    {
        using var context = CreateContext(nameof(ExtractData_WithText_PopulatesExtractedData));
        var userId = await CreateUserAsync(context);
        var service = new DocumentService(context);
        var aiService = new AiExtractionService();

        var doc = await service.CreateDocumentAsync(userId, new CreateDocumentRequest
        {
            Name = "Invoice",
            ExtractedText = "Invoice #INV-001\nDate: 01/15/2024\nTotal: $1,500.00\nEmail: client@example.com"
        });

        var result = await service.ExtractDataAsync(doc.Id, userId, aiService);

        Assert.NotNull(result);
        Assert.NotNull(result.ExtractedData);
        Assert.Contains("invoice_number", result.ExtractedData);
    }
}
