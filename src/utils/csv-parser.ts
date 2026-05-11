/**
 * 轻量 CSV 解析器 — RFC 4180 兼容
 * 支持引号包裹字段、双引号转义、字段含逗号/换行
 */

export interface CSVRow {
  [key: string]: string;
}

/**
 * 解析 CSV 文本为对象数组
 * @param text CSV 文本内容（首行为表头）
 */
export function parseCSV(text: string): CSVRow[] {
  const lines = splitCSVLines(text.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const result: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row: CSVRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    result.push(row);
  }

  return result;
}

/**
 * 解析单行 CSV（处理引号包裹和转义）
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  const len = line.length;

  while (i <= len) {
    if (i === len) {
      // 行尾
      if (fields.length > 0 || line.endsWith(',')) {
        fields.push('');
      }
      break;
    }

    if (line[i] === '"') {
      // 引号包裹字段
      const { value, endIdx } = readQuotedField(line, i);
      fields.push(value);
      i = endIdx + 1; // 跳过闭合引号
      if (i < len && line[i] === ',') i++; // 跳过分隔符
    } else {
      // 非引号字段
      const commaIdx = line.indexOf(',', i);
      if (commaIdx === -1) {
        fields.push(line.slice(i));
        break;
      } else {
        fields.push(line.slice(i, commaIdx));
        i = commaIdx + 1;
      }
    }
  }

  return fields;
}

/**
 * 读取引号包裹的字段（处理 "" 转义）
 */
function readQuotedField(line: string, start: number): { value: string; endIdx: number } {
  let value = '';
  let i = start + 1; // 跳过开头的 "

  while (i < line.length) {
    const quoteIdx = line.indexOf('"', i);
    if (quoteIdx === -1) {
      // 未闭合引号 — 取剩余内容
      value += line.slice(i);
      return { value, endIdx: line.length - 1 };
    }

    if (quoteIdx + 1 < line.length && line[quoteIdx + 1] === '"') {
      // "" 转义 → 一个 "
      value += line.slice(i, quoteIdx) + '"';
      i = quoteIdx + 2;
    } else {
      // 闭合引号
      value += line.slice(i, quoteIdx);
      return { value, endIdx: quoteIdx };
    }
  }

  return { value, endIdx: line.length - 1 };
}

/**
 * 按行分割 CSV 文本（处理字段内的换行）
 */
function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  if (current) lines.push(current);
  return lines;
}
