// Vitest-specific entrypoint (not the plain one, which assumes a Jest-style global `expect`).
import '@testing-library/jest-dom/vitest';
// test.globals isn't enabled, so RTL's auto-cleanup detection won't fire — register it explicitly.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
