using System.Globalization;
using ClosedXML.Excel;
using CsvHelper;
using Docusnake.API.Data;
using Docusnake.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Docusnake.API.Services;

public interface IExportService
{
    Task<byte[]> ExportToExcelAsync(Guid userId, Guid? folderId);
    Task<byte[]> ExportToCsvAsync(Guid userId, Guid? folderId);
}

public class ExportService : IExportService
{
    private readonly AppDbContext _context;

    public ExportService(AppDbContext context)
    {
        _context = context;
    }

    private async Task<List<DocumentResponse>> GetDocumentsAsync(Guid userId, Guid? folderId)
    {
        var query = _context.Documents
            .Include(d => d.Folder)
            .Where(d => d.UserId == userId);

        if (folderId.HasValue)
            query = query.Where(d => d.FolderId == folderId);

        var docs = await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
        return docs.Select(d => new DocumentResponse
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
        }).ToList();
    }

    public async Task<byte[]> ExportToExcelAsync(Guid userId, Guid? folderId)
    {
        var documents = await GetDocumentsAsync(userId, folderId);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Documents");

        // Headers
        worksheet.Cell(1, 1).Value = "ID";
        worksheet.Cell(1, 2).Value = "Name";
        worksheet.Cell(1, 3).Value = "Folder";
        worksheet.Cell(1, 4).Value = "Extracted Text";
        worksheet.Cell(1, 5).Value = "Extracted Data";
        worksheet.Cell(1, 6).Value = "Image Path";
        worksheet.Cell(1, 7).Value = "Created At";
        worksheet.Cell(1, 8).Value = "Updated At";

        var headerRow = worksheet.Row(1);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.LightBlue;

        for (int i = 0; i < documents.Count; i++)
        {
            var doc = documents[i];
            var row = i + 2;
            worksheet.Cell(row, 1).Value = doc.Id.ToString();
            worksheet.Cell(row, 2).Value = doc.Name;
            worksheet.Cell(row, 3).Value = doc.FolderName ?? "";
            worksheet.Cell(row, 4).Value = doc.ExtractedText ?? "";
            worksheet.Cell(row, 5).Value = doc.ExtractedData ?? "";
            worksheet.Cell(row, 6).Value = doc.OriginalImagePath ?? "";
            worksheet.Cell(row, 7).Value = doc.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
            worksheet.Cell(row, 8).Value = doc.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss");
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportToCsvAsync(Guid userId, Guid? folderId)
    {
        var documents = await GetDocumentsAsync(userId, folderId);

        using var stream = new MemoryStream();
        using var writer = new StreamWriter(stream);
        using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        csv.WriteHeader<CsvDocumentRecord>();
        await csv.NextRecordAsync();

        foreach (var doc in documents)
        {
            csv.WriteRecord(new CsvDocumentRecord
            {
                Id = doc.Id.ToString(),
                Name = doc.Name,
                Folder = doc.FolderName ?? "",
                ExtractedText = doc.ExtractedText ?? "",
                ExtractedData = doc.ExtractedData ?? "",
                ImagePath = doc.OriginalImagePath ?? "",
                CreatedAt = doc.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                UpdatedAt = doc.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss")
            });
            await csv.NextRecordAsync();
        }

        await writer.FlushAsync();
        return stream.ToArray();
    }
}

public class CsvDocumentRecord
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Folder { get; set; } = string.Empty;
    public string ExtractedText { get; set; } = string.Empty;
    public string ExtractedData { get; set; } = string.Empty;
    public string ImagePath { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}
