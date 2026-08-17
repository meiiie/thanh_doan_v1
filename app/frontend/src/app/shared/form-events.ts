/** Đọc giá trị điều khiển form từ sự kiện DOM bằng cách thu hẹp kiểu phần tử đích. */
export function targetValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
    ? target.value
    : '';
}

export function targetChecked(event: Event): boolean {
  return event.target instanceof HTMLInputElement ? event.target.checked : false;
}
