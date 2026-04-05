using Microsoft.EntityFrameworkCore;
using Docusnake.API.Data;
using Docusnake.API.DTOs;
using Docusnake.API.Models;

namespace Docusnake.API.Services;

public interface IFolderService
{
    Task<List<FolderResponse>> GetRootFoldersAsync(Guid userId);
    Task<FolderResponse?> GetFolderAsync(Guid id, Guid userId);
    Task<FolderResponse> CreateFolderAsync(Guid userId, CreateFolderRequest request);
    Task<FolderResponse?> UpdateFolderAsync(Guid id, Guid userId, UpdateFolderRequest request);
    Task<bool> DeleteFolderAsync(Guid id, Guid userId);
}

public class FolderService : IFolderService
{
    private readonly AppDbContext _context;

    public FolderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<FolderResponse>> GetRootFoldersAsync(Guid userId)
    {
        var folders = await _context.Folders
            .Include(f => f.Children)
            .Include(f => f.Documents)
            .Where(f => f.UserId == userId && f.ParentFolderId == null)
            .OrderBy(f => f.Name)
            .ToListAsync();

        return folders.Select(f => MapToResponse(f, true)).ToList();
    }

    public async Task<FolderResponse?> GetFolderAsync(Guid id, Guid userId)
    {
        var folder = await _context.Folders
            .Include(f => f.Children).ThenInclude(c => c.Documents)
            .Include(f => f.Documents).ThenInclude(d => d.Folder)
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

        return folder == null ? null : MapToResponse(folder, true);
    }

    public async Task<FolderResponse> CreateFolderAsync(Guid userId, CreateFolderRequest request)
    {
        var folder = new Folder
        {
            UserId = userId,
            Name = request.Name,
            ParentFolderId = request.ParentFolderId
        };

        _context.Folders.Add(folder);
        await _context.SaveChangesAsync();

        return MapToResponse(folder, false);
    }

    public async Task<FolderResponse?> UpdateFolderAsync(Guid id, Guid userId, UpdateFolderRequest request)
    {
        var folder = await _context.Folders.FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
        if (folder == null) return null;

        // Prevent circular reference: don't allow a folder to be its own parent or ancestor
        if (request.ParentFolderId.HasValue)
        {
            if (request.ParentFolderId.Value == id) return null;
            if (await IsDescendantAsync(request.ParentFolderId.Value, id)) return null;
        }

        folder.Name = request.Name;
        folder.ParentFolderId = request.ParentFolderId;
        await _context.SaveChangesAsync();

        return await GetFolderAsync(id, userId);
    }

    public async Task<bool> DeleteFolderAsync(Guid id, Guid userId)
    {
        var folder = await _context.Folders.FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
        if (folder == null) return false;

        _context.Folders.Remove(folder);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<bool> IsDescendantAsync(Guid potentialDescendantId, Guid ancestorId)
    {
        var current = await _context.Folders.FindAsync(potentialDescendantId);
        while (current != null)
        {
            if (current.ParentFolderId == ancestorId) return true;
            if (current.ParentFolderId == null) break;
            current = await _context.Folders.FindAsync(current.ParentFolderId);
        }
        return false;
    }

    private static FolderResponse MapToResponse(Folder f, bool includeChildren) => new()
    {
        Id = f.Id,
        UserId = f.UserId,
        ParentFolderId = f.ParentFolderId,
        Name = f.Name,
        CreatedAt = f.CreatedAt,
        Children = includeChildren
            ? f.Children.Select(c => MapToResponse(c, false)).ToList()
            : new List<FolderResponse>(),
        Documents = f.Documents.Select(d => new DocumentResponse
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
            FolderName = f.Name
        }).ToList()
    };
}
