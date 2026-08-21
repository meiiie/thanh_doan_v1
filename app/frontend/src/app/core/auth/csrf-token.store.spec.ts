import { TestBed } from '@angular/core/testing';
import { CsrfTokenStore } from './csrf-token.store';

describe('CsrfTokenStore', () => {
  let store: CsrfTokenStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CsrfTokenStore);
  });

  it('stores the current token', () => {
    store.set('csrf-123');

    expect(store.token()).toBe('csrf-123');
  });

  it('clears the token on logout', () => {
    store.set('csrf-123');
    store.clear();

    expect(store.token()).toBe('');
  });
});
