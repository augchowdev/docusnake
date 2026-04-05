using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Docusnake.API.DTOs;
using Docusnake.API.Services;

namespace Docusnake.API.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly IAiExtractionService _aiExtractionService;

    public DocumentsController(IDocumentService documentService, IAiExtractionService aiExtractionService)
    {
        _documentService = documentService;
        _aiExtractionService = aiExtractionService;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetDocuments([FromQuery] Guid? folderId)
    {
        var docs = await _documentService.GetDocumentsAsync(GetUserId(), folderId);
        return Ok(docs);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDocument(Guid id)
    {
        var doc = await _documentService.GetDocumentAsync(id, GetUserId());
        return doc == null ? NotFound() : Ok(doc);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDocument([FromBody] CreateDocumentRequest request)
    {
        var doc = await _documentService.CreateDocumentAsync(GetUserId(), request);
        return CreatedAtAction(nameof(GetDocument), new { id = doc.Id }, doc);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateDocument(Guid id, [FromBody] UpdateDocumentRequest request)
    {
        var doc = await _documentService.UpdateDocumentAsync(id, GetUserId(), request);
        return doc == null ? NotFound() : Ok(doc);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        var deleted = await _documentService.DeleteDocumentAsync(id, GetUserId());
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/extract")]
    public async Task<IActionResult> ExtractData(Guid id)
    {
        var doc = await _documentService.ExtractDataAsync(id, GetUserId(), _aiExtractionService);
        return doc == null ? NotFound() : Ok(doc);
    }
}
