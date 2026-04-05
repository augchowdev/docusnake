using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Docusnake.API.DTOs;
using Docusnake.API.Services;

namespace Docusnake.API.Controllers;

[ApiController]
[Route("api/folders")]
[Authorize]
public class FoldersController : ControllerBase
{
    private readonly IFolderService _folderService;

    public FoldersController(IFolderService folderService)
    {
        _folderService = folderService;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetFolders()
    {
        var folders = await _folderService.GetRootFoldersAsync(GetUserId());
        return Ok(folders);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetFolder(Guid id)
    {
        var folder = await _folderService.GetFolderAsync(id, GetUserId());
        return folder == null ? NotFound() : Ok(folder);
    }

    [HttpPost]
    public async Task<IActionResult> CreateFolder([FromBody] CreateFolderRequest request)
    {
        var folder = await _folderService.CreateFolderAsync(GetUserId(), request);
        return CreatedAtAction(nameof(GetFolder), new { id = folder.Id }, folder);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateFolder(Guid id, [FromBody] UpdateFolderRequest request)
    {
        var folder = await _folderService.UpdateFolderAsync(id, GetUserId(), request);
        return folder == null ? NotFound() : Ok(folder);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteFolder(Guid id)
    {
        var deleted = await _folderService.DeleteFolderAsync(id, GetUserId());
        return deleted ? NoContent() : NotFound();
    }
}
