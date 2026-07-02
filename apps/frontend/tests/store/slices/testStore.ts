// Composes all 6 reducers so slice tests satisfy the full RootState type.
import { configureStore } from '@reduxjs/toolkit';
import authReducer from 'store/slices/authSlice';
import uiReducer from 'store/slices/uiSlice';
import usersReducer from 'store/slices/usersSlice';
import conversationReducer from 'store/slices/conversationSlice';
import appointmentReducer from 'store/slices/appointmentSlice';
import clientReducer from 'store/slices/clientSlice';

export function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      users: usersReducer,
      conversation: conversationReducer,
      appointment: appointmentReducer,
      client: clientReducer,
    },
  });
}
