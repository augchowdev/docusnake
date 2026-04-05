using System.ComponentModel.DataAnnotations;

namespace Docusnake.API.DTOs;

public class CreateDocumentRequest
{
    [Required]
    [MinLength(1)]
    public string Name { get; set; } = string.Empty;
    public Guid? FolderId { get; set; }
    public string? OriginalImagePath { get; set; }
    public string? ExtractedText { get; set; }
}

public class UpdateDocumentRequest
{
    [Required]
    [MinLength(1)]
    public string Name { get; set; } = string.Empty;
    public Guid? FolderId { get; set; }
    public string? OriginalImagePath { get; set; }
    public string? ExtractedText { get; set; }
    public string? ExtractedData { get; set; }
}

public class DocumentResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? FolderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? OriginalImagePath { get; set; }
    public string? ExtractedText { get; set; }
    public string? ExtractedData { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? FolderName { get; set; }
}
