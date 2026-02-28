/**
 * URL Helper
 * Utility functions để xử lý URL
 */

/**
 * Build full public URL từ attachment ID
 * @param attachmentId - UUID của attachment record
 * @returns Full URL để xem file hoặc empty string nếu không có ID
 */
export function buildPublicUrl(attachmentId?: string | null): string {
  if (!attachmentId) {
    return '';
  }

  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}/attachments/view/${attachmentId}`;
}

/**
 * Build download URL từ attachment ID
 */
export function buildDownloadUrl(attachmentId?: string | null): string {
  if (!attachmentId) {
    return '';
  }

  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}/attachments/download/${attachmentId}`;
}
