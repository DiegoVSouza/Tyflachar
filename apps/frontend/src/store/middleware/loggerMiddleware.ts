/* eslint-disable no-console */
import type { Middleware } from '@reduxjs/toolkit';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loggerMiddleware: Middleware<Record<string, never>, any> =
  (store) => (next) => (action) => {
    if (typeof action === 'function') return next(action);

    const prevState = store.getState();
    const result = next(action);
    const nextState = store.getState();

    console.group(
      `%c action: ${(action as { type: string }).type}`,
      'color: #4CAF50; font-weight: bold'
    );
    console.log('%c prev state', 'color: #9E9E9E', prevState);
    console.log('%c action    ', 'color: #03A9F4', action);
    console.log('%c next state', 'color: #4CAF50', nextState);
    console.groupEnd();

    return result;
  };
