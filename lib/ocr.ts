import Tesseract from 'tesseract.js';

export interface ExtractedDates {
  issueDate: string | null;
  expirationDate: string | null;
  allDates: string[];
  rawText: string;
  confidence: number;
}

// Common date patterns to extract
const datePatterns = [
  // MM/DD/YYYY or MM-DD-YYYY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
  // YYYY/MM/DD or YYYY-MM-DD
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g,
  // Month DD, YYYY (e.g., January 15, 2024)
  /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi,
  // DD Month YYYY (e.g., 15 January 2024)
  /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
  // Mon DD, YYYY (e.g., Jan 15, 2024)
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/gi,
];

const monthNames: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// Keywords that often appear near dates on certifications
const issueKeywords = ['issued', 'issue date', 'date issued', 'effective', 'start date', 'from', 'valid from'];
const expirationKeywords = ['expires', 'expiration', 'exp', 'valid until', 'valid through', 'end date', 'to', 'expiry'];

function parseDate(dateStr: string): Date | null {
  try {
    // Try MM/DD/YYYY or MM-DD-YYYY
    let match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (match) {
      return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
    }

    // Try YYYY/MM/DD or YYYY-MM-DD
    match = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    }

    // Try month name formats
    match = dateStr.match(/(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i);
    if (match) {
      const month = monthNames[match[1].toLowerCase()];
      return new Date(parseInt(match[3]), month - 1, parseInt(match[2]));
    }

    // Try DD Month YYYY
    match = dateStr.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
    if (match) {
      const month = monthNames[match[2].toLowerCase()];
      return new Date(parseInt(match[3]), month - 1, parseInt(match[1]));
    }

    return null;
  } catch {
    return null;
  }
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractDatesFromText(text: string): string[] {
  const dates: string[] = [];
  const seen = new Set<string>();

  for (const pattern of datePatterns) {
    const matches = text.matchAll(new RegExp(pattern));
    for (const match of matches) {
      const dateStr = match[0];
      if (!seen.has(dateStr)) {
        seen.add(dateStr);
        dates.push(dateStr);
      }
    }
  }

  return dates;
}

function findDateNearKeyword(text: string, keywords: string[], allDates: string[]): string | null {
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    const keywordIndex = lowerText.indexOf(keyword);
    if (keywordIndex === -1) continue;

    // Look for dates near this keyword (within 100 characters)
    const nearbyText = text.substring(Math.max(0, keywordIndex - 20), Math.min(text.length, keywordIndex + keyword.length + 100));
    const nearbyDates = extractDatesFromText(nearbyText);

    if (nearbyDates.length > 0) {
      return nearbyDates[0];
    }
  }

  return null;
}

function categorizeDate(date: Date, now: Date): 'past' | 'future' {
  return date < now ? 'past' : 'future';
}

export async function extractDatesFromImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ExtractedDates> {
  const result: ExtractedDates = {
    issueDate: null,
    expirationDate: null,
    allDates: [],
    rawText: '',
    confidence: 0,
  };

  try {
    const ocrResult = await Tesseract.recognize(file, 'eng', {
      logger: (info) => {
        if (info.status === 'recognizing text' && onProgress) {
          onProgress(info.progress * 100);
        }
      },
    });

    result.rawText = ocrResult.data.text;
    result.confidence = ocrResult.data.confidence;

    // Extract all dates from the text
    const dateStrings = extractDatesFromText(result.rawText);
    result.allDates = dateStrings;

    if (dateStrings.length === 0) {
      return result;
    }

    // Try to identify issue and expiration dates based on context
    const issueDateStr = findDateNearKeyword(result.rawText, issueKeywords, dateStrings);
    const expirationDateStr = findDateNearKeyword(result.rawText, expirationKeywords, dateStrings);

    if (issueDateStr) {
      const parsed = parseDate(issueDateStr);
      if (parsed) {
        result.issueDate = formatDateForInput(parsed);
      }
    }

    if (expirationDateStr) {
      const parsed = parseDate(expirationDateStr);
      if (parsed) {
        result.expirationDate = formatDateForInput(parsed);
      }
    }

    // If we couldn't find dates by context, try to infer from the dates themselves
    if (!result.issueDate || !result.expirationDate) {
      const now = new Date();
      const parsedDates = dateStrings
        .map(d => ({ str: d, date: parseDate(d) }))
        .filter((d): d is { str: string; date: Date } => d.date !== null)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (parsedDates.length >= 2) {
        // If we have multiple dates, assume earliest is issue and latest is expiration
        if (!result.issueDate) {
          result.issueDate = formatDateForInput(parsedDates[0].date);
        }
        if (!result.expirationDate) {
          const futureDates = parsedDates.filter(d => categorizeDate(d.date, now) === 'future');
          if (futureDates.length > 0) {
            result.expirationDate = formatDateForInput(futureDates[futureDates.length - 1].date);
          } else {
            result.expirationDate = formatDateForInput(parsedDates[parsedDates.length - 1].date);
          }
        }
      } else if (parsedDates.length === 1) {
        // Single date - determine if it's issue or expiration based on whether it's past or future
        const date = parsedDates[0].date;
        const formatted = formatDateForInput(date);
        if (categorizeDate(date, now) === 'past' && !result.issueDate) {
          result.issueDate = formatted;
        } else if (!result.expirationDate) {
          result.expirationDate = formatted;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('OCR error:', error);
    return result;
  }
}

// Helper to create a preview-friendly version of the extracted data
export function formatExtractedData(data: ExtractedDates): Record<string, unknown> {
  return {
    suggested_issue_date: data.issueDate,
    suggested_expiration_date: data.expirationDate,
    all_dates_found: data.allDates,
    ocr_confidence: Math.round(data.confidence),
    raw_text_length: data.rawText.length,
  };
}
