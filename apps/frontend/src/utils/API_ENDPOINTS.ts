export const API_ENDPOINTS = {
  auth: {
    login:   '/auth/login',
    logout:  '/auth/logout',
    refresh: '/auth/refresh',
    me:      '/auth/me',
  },
  users: {
    list:   '/users',
    byId:   (id: string): string => `/users/${id}`,
    create: '/users',
    update: (id: string): string => `/users/${id}`,
    delete: (id: string): string => `/users/${id}`,
  },
} as const;
