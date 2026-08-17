import { HttpErrorResponse } from '@angular/common/http';

/**
 * Đọc thông điệp `detail` từ phản hồi lỗi Problem Details (RFC 7807) của backend
 * để hiển thị cho người dùng; khi không có `detail` hợp lệ thì dùng câu dự phòng.
 */
export function problemDetail(error: HttpErrorResponse, fallback: string): string {
  const body = error.error;
  if (
    body instanceof Object &&
    'detail' in body &&
    body.detail !== undefined &&
    body.detail !== null
  ) {
    return String(body.detail);
  }
  return fallback;
}
