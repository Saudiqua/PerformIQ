export function nowISO(): string {
  return new Date().toISOString();
}

export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function slackTsToDate(ts: string): Date {
  const seconds = parseFloat(ts);
  return new Date(seconds * 1000);
}

export function dateToSlackTs(date: Date): string {
  return (date.getTime() / 1000).toFixed(6);
}

export function gmailInternalDateToDate(internalDate: string): Date {
  return new Date(parseInt(internalDate, 10));
}
