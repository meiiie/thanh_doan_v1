import { HttpErrorResponse } from '@angular/common/http';
import { problemDetail } from './problem-detail';

describe('problemDetail', () => {
  it('uses the server detail when present', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: { detail: 'Cần chọn ít nhất một hạng mục.' },
    });

    expect(problemDetail(error, 'Dự phòng')).toBe('Cần chọn ít nhất một hạng mục.');
  });

  it('normalizes non-string detail values', () => {
    const error = new HttpErrorResponse({ status: 409, error: { detail: 12 } });

    expect(problemDetail(error, 'Dự phòng')).toBe('12');
  });

  it('falls back for non Problem Details responses', () => {
    const error = new HttpErrorResponse({ status: 500, error: 'proxy failure' });

    expect(problemDetail(error, 'Không thể xử lý yêu cầu.')).toBe('Không thể xử lý yêu cầu.');
  });
});
