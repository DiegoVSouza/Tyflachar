import { configureStore, type Middleware } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import usersReducer from './slices/usersSlice';
import conversationReducer from './slices/conversationSlice';
import appointmentReducer from './slices/appointmentSlice';
import clientReducer from './slices/clientSlice';
import { loggerMiddleware } from './middleware/loggerMiddleware';

const reducer = {
  auth: authReducer,
  ui: uiReducer,
  users: usersReducer,
  conversation: conversationReducer,
  appointment: appointmentReducer,
  client: clientReducer,
};

const devMiddlewares: Middleware[] =
  process.env.NODE_ENV !== 'production' ? [loggerMiddleware] : [];

export const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(...devMiddlewares),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = {
  auth: ReturnType<typeof authReducer>;
  ui: ReturnType<typeof uiReducer>;
  users: ReturnType<typeof usersReducer>;
  conversation: ReturnType<typeof conversationReducer>;
  appointment: ReturnType<typeof appointmentReducer>;
  client: ReturnType<typeof clientReducer>;
};
export type AppDispatch = typeof store.dispatch;
