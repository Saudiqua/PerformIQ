export function truncate(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function parseEmailAddresses(headerValue: string | undefined): string[] {
  if (!headerValue) return [];
  
  const addresses: string[] = [];
  const matches = headerValue.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (matches) {
    addresses.push(...matches);
  }
  return addresses;
}

export function extractEmailFromHeader(headerValue: string | undefined): string | undefined {
  if (!headerValue) return undefined;
  const match = headerValue.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : undefined;
}
