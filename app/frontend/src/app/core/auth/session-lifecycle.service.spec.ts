import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionLifecycleService } from './session-lifecycle.service';

describe('SessionLifecycleService', () => {
  let service: SessionLifecycleService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T10:00:00.000Z'));
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionLifecycleService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('ignores an invalid expiry header', () => {
    service.observe('not-a-date');

    expect(service.remainingSeconds()).toBeNull();
  });

  it('shows a warning during the final two minutes', () => {
    service.observe('2026-08-20T10:01:30.000Z');

    expect(service.remainingSeconds()).toBe(90);
    expect(service.warningVisible()).toBe(true);
  });

  it('clears the observed expiry on logout', () => {
    service.observe('2026-08-20T10:05:00.000Z');
    service.clear();

    expect(service.remainingSeconds()).toBeNull();
    expect(service.warningVisible()).toBe(false);
  });
});
