import { describe, expect, it } from 'vitest';
import { createTestStore } from './testStore';
import {
  addNotification,
  clearNotifications,
  closeModal,
  openModal,
  removeNotification,
  selectActiveModal,
  selectModalData,
  selectNotifications,
  selectSidebarOpen,
  selectTheme,
  setSidebarOpen,
  setTheme,
  toggleSidebar,
  toggleTheme,
} from 'store/slices/uiSlice';

function makeStore() {
  return createTestStore();
}

describe('uiSlice', () => {
  it('has the expected initial state', () => {
    const store = makeStore();
    expect(store.getState().ui).toEqual({
      sidebarOpen: true,
      theme: 'light',
      notifications: [],
      activeModal: null,
      modalData: null,
    });
  });

  describe('sidebar', () => {
    it('toggleSidebar flips sidebarOpen', () => {
      const store = makeStore();
      store.dispatch(toggleSidebar());
      expect(selectSidebarOpen(store.getState())).toBe(false);
      store.dispatch(toggleSidebar());
      expect(selectSidebarOpen(store.getState())).toBe(true);
    });

    it('setSidebarOpen sets an explicit value', () => {
      const store = makeStore();
      store.dispatch(setSidebarOpen(false));
      expect(selectSidebarOpen(store.getState())).toBe(false);
    });
  });

  describe('theme', () => {
    it('toggleTheme switches between light and dark', () => {
      const store = makeStore();
      store.dispatch(toggleTheme());
      expect(selectTheme(store.getState())).toBe('dark');
      store.dispatch(toggleTheme());
      expect(selectTheme(store.getState())).toBe('light');
    });

    it('setTheme sets an explicit theme', () => {
      const store = makeStore();
      store.dispatch(setTheme('dark'));
      expect(selectTheme(store.getState())).toBe('dark');
    });
  });

  describe('notifications', () => {
    it('addNotification appends a notification with defaults', () => {
      const store = makeStore();
      store.dispatch(addNotification({ message: 'Hello' }));

      const notifications = selectNotifications(store.getState());
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        type: 'info',
        message: 'Hello',
        duration: 4_000,
      });
      expect(typeof notifications[0]!.id).toBe('number');
    });

    it('addNotification respects explicit type and duration', () => {
      const store = makeStore();
      store.dispatch(addNotification({ type: 'error', message: 'Oops', duration: 1000 }));

      const [notification] = selectNotifications(store.getState());
      expect(notification).toMatchObject({ type: 'error', message: 'Oops', duration: 1000 });
    });

    it('assigns increasing unique ids across notifications', () => {
      const store = makeStore();
      store.dispatch(addNotification({ message: 'First' }));
      store.dispatch(addNotification({ message: 'Second' }));

      const [first, second] = selectNotifications(store.getState());
      expect(first!.id).not.toBe(second!.id);
    });

    it('removeNotification removes only the targeted notification', () => {
      const store = makeStore();
      store.dispatch(addNotification({ message: 'First' }));
      store.dispatch(addNotification({ message: 'Second' }));
      const [first, second] = selectNotifications(store.getState());

      store.dispatch(removeNotification(first!.id));

      const remaining = selectNotifications(store.getState());
      expect(remaining).toHaveLength(1);
      expect(remaining[0]!.id).toBe(second!.id);
    });

    it('clearNotifications empties the list', () => {
      const store = makeStore();
      store.dispatch(addNotification({ message: 'First' }));
      store.dispatch(addNotification({ message: 'Second' }));

      store.dispatch(clearNotifications());

      expect(selectNotifications(store.getState())).toEqual([]);
    });
  });

  describe('modal', () => {
    it('openModal sets the active modal name and data', () => {
      const store = makeStore();
      store.dispatch(openModal({ name: 'confirm-delete', data: { id: 42 } }));

      const state = store.getState();
      expect(selectActiveModal(state)).toBe('confirm-delete');
      expect(selectModalData(state)).toEqual({ id: 42 });
    });

    it('openModal defaults data to null when not provided', () => {
      const store = makeStore();
      store.dispatch(openModal({ name: 'simple-modal' }));

      expect(selectModalData(store.getState())).toBeNull();
    });

    it('closeModal clears the active modal and data', () => {
      const store = makeStore();
      store.dispatch(openModal({ name: 'confirm-delete', data: { id: 42 } }));
      store.dispatch(closeModal());

      const state = store.getState();
      expect(selectActiveModal(state)).toBeNull();
      expect(selectModalData(state)).toBeNull();
    });
  });
});
