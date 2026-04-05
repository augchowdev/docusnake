using Microsoft.EntityFrameworkCore;
using Docusnake.API.Data;
using Docusnake.API.DTOs;
using Docusnake.API.Models;

namespace Docusnake.API.Services;

public interface IDocumentService
{
    Task<List<DocumentResponse>> GetDocumentsAsync(Guid userId, Guid? folderId);
    Task<DocumentResponse?> GetDocumentAsync(Guid id, Guid userId);
    Task<DocumentResponse> CreateDocumentAsync(Guid userId, CreateDocumentRequest request);
    Task<DocumentResponse?> UpdateDocumentAsync(Guid id, Guid userId, UpdateDocumentRequest request);
    Task<bool> DeleteDocumentAsync(Guid id, Guid userId);
    Task<DocumentResponse?> ExtractDataAsync(Guid id, Guid userId, IAiExtractionService aiService);
}

public class DocumentService : IDocumentService
{
    private readonly AppDbContext _context;

    public DocumentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DocumentResponse>> GetDocumentsAsync(Guid userId, Guid? folderId)
    {
        var query = _context.Documents
            .Include(d => d.Folder)
            .Where(d => d.UserId == userId);

        if (folderId.HasValue)
            query = query.Where(d => d.FolderId == folderId);

        var docs = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
        return docs.Select(MapToResponse).ToList();
    }

    public async Task<DocumentResponse?> GetDocumentAsync(Guid id, Guid userId)
    {
        var doc = await _context.Documents
            .Include(d => d.Folder)
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
        return doc == null ? null : MapToResponse(doc);
    }

    public async Task<DocumentResponse> CreateDocumentAsync(Guid userId, CreateDocumentRequest request)
    {
        var doc = new Document
        {
            UserId = userId,
            FolderId = request.FolderId,
            Name = request.Name,
            OriginalImagePath = request.OriginalImagePath,
            ExtractedText = request.ExtractedText
        };

        _context.Documents.Add(doc);
        await _context.SaveChangesAsync();

        return await GetDocumentAsync(doc.Id, userId) ?? MapToResponse(doc);
    }

    public async Task<DocumentResponse?> UpdateDocumentAsync(Guid id, Guid userId, UpdateDocumentRequest request)
    {
        var doc = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
        if (doc == null) return null;

        doc.Name = request.Name;
        doc.FolderId = request.FolderId;
        doc.OriginalImagePath = request.OriginalImagePath;
        doc.ExtractedText = request.ExtractedText;
        doc.ExtractedData = request.ExtractedData;
        doc.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetDocumentAsync(id, userId);
    }

    public async Task<bool> DeleteDocumentAsync(Guid id, Guid userId)
    {
        var doc = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
        if (doc == null) return false;

        _context.Documents.Remove(doc);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DocumentResponse?> ExtractDataAsync(Guid id, Guid userId, IAiExtractionService aiService)
    {
        var doc = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
        if (doc == null) return null;

        if (!string.IsNullOrWhiteSpace(doc.ExtractedText))
        {
            var extracted = await aiService.ExtractAsync(doc.ExtractedText);
            doc.ExtractedData = System.Text.Json.JsonSerializer.Serialize(extracted);
            doc.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return await GetDocumentAsync(id, userId);
    }

    private static DocumentResponse MapToResponse(Document d) => new()
    {
        Id = d.Id,
        UserId = d.UserId,
        FolderId = d.FolderId,
        Name = d.Name,
        OriginalImagePath = d.OriginalImagePath,
        ExtractedText = d.ExtractedText,
        ExtractedData = d.ExtractedData,
        CreatedAt = d.CreatedAt,
        UpdatedAt = d.UpdatedAt,
        FolderName = d.Folder?.Name
    };
}
