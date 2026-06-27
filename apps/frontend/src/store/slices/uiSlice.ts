import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Notification, NotificationType, Theme } from 'types';
import type { RootState } from '../index';

// ─── State ────────────────────────────────────────────────────────────────────

interface UiState {
  sidebarOpen: boolean;
  theme: Theme;
  notifications: Notification[];
  activeModal: string | null;
  modalData: unknown;
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
  activeModal: null,
  modalData: null,
};

let notificationIdCounter = 0;

// ─── Slice ────────────────────────────────────────────────────────────────────

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },

    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },

    addNotification(
      state,
      action: PayloadAction<{ type?: NotificationType; message: string; duration?: number }>
    ) {
      state.notifications.push({
        id: ++notificationIdCounter,
        type: action.payload.type ?? 'info',
        message: action.payload.message,
        duration: action.payload.duration ?? 4_000,
      });
    },
    removeNotification(state, action: PayloadAction<number>) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications(state) {
      state.notifications = [];
    },

    openModal(state, action: PayloadAction<{ name: string; data?: unknown }>) {
      state.activeModal = action.payload.name;
      state.modalData = action.payload.data ?? null;
    },
    closeModal(state) {
      state.activeModal = null;
      state.modalData = null;
    },
  },
});

// ─── Actions ─────────────────────────────────────────────────────────────────

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleTheme,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
} = uiSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectSidebarOpen = (state: RootState): boolean => state.ui.sidebarOpen;
export const selectTheme = (state: RootState): Theme => state.ui.theme;
export const selectNotifications = (state: RootState): Notification[] => state.ui.notifications;
export const selectActiveModal = (state: RootState): string | null => state.ui.activeModal;
export const selectModalData = (state: RootState): unknown => state.ui.modalData;

export default uiSlice.reducer;
