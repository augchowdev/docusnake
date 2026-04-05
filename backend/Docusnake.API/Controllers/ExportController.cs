using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Docusnake.API.Services;

namespace Docusnake.API.Controllers;

[ApiController]
[Route("api/export")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly IExportService _exportService;

    public ExportController(IExportService exportService)
    {
        _exportService = exportService;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] Guid? folderId)
    {
        var bytes = await _exportService.ExportToExcelAsync(GetUserId(), folderId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "documents.xlsx");
    }

    [HttpGet("csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] Guid? folderId)
    {
        var bytes = await _exportService.ExportToCsvAsync(GetUserId(), folderId);
        return File(bytes, "text/csv", "documents.csv");
    }
}
