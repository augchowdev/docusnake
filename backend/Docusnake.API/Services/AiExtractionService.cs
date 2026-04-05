using System.Text.RegularExpressions;

namespace Docusnake.API.Services;

public interface IAiExtractionService
{
    Task<Dictionary<string, string>> ExtractAsync(string text);
}

public class AiExtractionService : IAiExtractionService
{
    private static readonly (string Key, Regex Pattern)[] Patterns =
    {
        ("date", new Regex(@"\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})\b", RegexOptions.IgnoreCase)),
        ("email", new Regex(@"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")),
        ("phone", new Regex(@"\b(\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}\b")),
        ("amount", new Regex(@"\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?")),
        ("name", new Regex(@"(?:Name|Patient|Customer|Client|Employee)\s*:\s*([A-Za-z\s]+)", RegexOptions.IgnoreCase)),
        ("address", new Regex(@"\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b", RegexOptions.IgnoreCase)),
        ("invoice_number", new Regex(@"(?:Invoice|Inv|Receipt)\s*#?\s*:?\s*([A-Z0-9\-]+)", RegexOptions.IgnoreCase)),
        ("total", new Regex(@"(?:Total|Amount Due|Balance Due)\s*:?\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)", RegexOptions.IgnoreCase)),
    };

    public Task<Dictionary<string, string>> ExtractAsync(string text)
    {
        var result = new Dictionary<string, string>();

        foreach (var (key, pattern) in Patterns)
        {
            var match = pattern.Match(text);
            if (match.Success)
            {
                var value = match.Groups.Count > 1 && match.Groups[1].Success
                    ? match.Groups[1].Value.Trim()
                    : match.Value.Trim();
                result[key] = value;
            }
        }

        return Task.FromResult(result);
    }
}
