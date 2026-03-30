import type { Int64Value, TimestampValue } from '../types/contracts';

const numberFormatter = new Intl.NumberFormat('ru-RU');
const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function toNumber(value: Int64Value | number | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function formatNumber(value: Int64Value | number | null | undefined): string {
  const normalized = toNumber(value);
  return normalized === null ? '—' : numberFormatter.format(normalized);
}

export function formatBytes(value: Int64Value | number | null | undefined): string {
  const normalized = toNumber(value);

  if (normalized === null) {
    return '—';
  }

  if (Math.abs(normalized) < 1024) {
    return `${numberFormatter.format(normalized)} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB', 'PB'];
  let currentValue = normalized;
  let unitIndex = -1;

  do {
    currentValue /= 1024;
    unitIndex += 1;
  } while (Math.abs(currentValue) >= 1024 && unitIndex < units.length - 1);

  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: currentValue >= 100 ? 0 : 1,
    maximumFractionDigits: currentValue >= 100 ? 0 : 1,
  }).format(currentValue)} ${units[unitIndex]}`;
}

export function toDate(value: TimestampValue | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const seconds = toNumber(value.seconds);
  if (seconds === null) {
    return null;
  }

  const milliseconds = seconds * 1000 + Math.floor((value.nanos ?? 0) / 1_000_000);
  const parsed = new Date(milliseconds);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTimestamp(value: TimestampValue | undefined): string {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : '—';
}

export function matchesDateRange(
  value: TimestampValue | undefined,
  dateFrom: string,
  dateTo: string,
): boolean {
  const date = toDate(value);

  if (!date) {
    return !dateFrom && !dateTo;
  }

  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`);
    if (date < from) {
      return false;
    }
  }

  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59`);
    if (date > to) {
      return false;
    }
  }

  return true;
}

export function normalizeText(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}
