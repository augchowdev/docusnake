using System.ComponentModel.DataAnnotations;

namespace Docusnake.API.DTOs;

public class CreateFolderRequest
{
    [Required]
    [MinLength(1)]
    public string Name { get; set; } = string.Empty;
    public Guid? ParentFolderId { get; set; }
}

public class UpdateFolderRequest
{
    [Required]
    [MinLength(1)]
    public string Name { get; set; } = string.Empty;
    public Guid? ParentFolderId { get; set; }
}

public class FolderResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? ParentFolderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<FolderResponse> Children { get; set; } = new();
    public List<DocumentResponse> Documents { get; set; } = new();
}
