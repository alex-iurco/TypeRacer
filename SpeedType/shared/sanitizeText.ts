// Shared sanitization utility for SpeedType (frontend & backend)
export function sanitizeText(text: string): string {
  // Remove emojis and pictograms (Unicode property escapes)
  let cleaned = text.replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F1E6}-\u{1F1FF}])/gu, '');
  // Normalize en/em dashes to hyphen-minus
  cleaned = cleaned.replace(/[\u2013\u2014]/g, '-');
  // Remove all non-ASCII printable characters except basic punctuation
  cleaned = cleaned.replace(/[^\x20-\x7E\n\r.,;:!?"'()\-]/g, '');
  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}
