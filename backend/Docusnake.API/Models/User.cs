
namespace Docusnake.API.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<Folder> Folders { get; set; } = new List<Folder>();
}
