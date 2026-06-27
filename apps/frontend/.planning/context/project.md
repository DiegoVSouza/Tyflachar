# PROJECT CONTEXT — FRONTEND
# This file is injected into every agent spawn. Keep it accurate and concise.
# Last updated: [UPDATE ME]

## Project
Name: SharpEdge
Stack: React 18 + TypeScript + Redux Toolkit + React Router DOM v6 + CSS Modules + native fetch
Repo: /frontend

## Architecture

```
Page (src/pages/<Resource>/index.tsx)
  └── Hook (src/hooks/use<Resource>.ts)
        └── Store Slice (src/store/slices/<resource>Slice.ts)  ← state + thunks
              └── Service (src/services/api/<resource>Service.ts)
                    └── apiClient (src/services/api/apiClient.ts)  ← single fetch wrapper
```

### Directory Map

```
src/
├── types/index.ts              ← ALL shared TypeScript types (branded types, interfaces)
├── services/
│   ├── api/
│   │   ├── apiClient.ts        ← fetch wrapper: JWT injection, ApiError, timeout
│   │   ├── authService.ts      ← auth API calls
│   │   └── <resource>Service.ts
│   └── utils/
│       └── tokenStorage.ts     ← localStorage abstraction for JWT token
├── store/
│   ├── index.ts                ← configureStore, RootState, AppDispatch
│   ├── middleware/             ← custom Redux middleware
│   └── slices/
│       ├── authSlice.ts        ← auth state + login/logout thunks
│       ├── uiSlice.ts          ← global UI state (notifications, modals)
│       └── <resource>Slice.ts
├── hooks/
│   ├── useAuth.ts              ← public facade for authSlice
│   ├── useUsers.ts             ← public facade for usersSlice
│   └── use<Resource>.ts
├── pages/
│   └── <Resource>/
│       └── index.tsx           ← route component, imports hook, renders components
├── components/
│   ├── ui/                     ← Button, Input, etc. (no Redux, no fetch)
│   ├── layout/                 ← AppShell, Header, Sidebar (layout only)
│   └── shared/                 ← Domain-agnostic reusable components
└── styles/
    └── tokens.css              ← CSS custom properties (design tokens)
```

## Conventions

### Adding a new resource
1. Add types to `src/types/index.ts`
2. Create service `src/services/api/<resource>Service.ts` (calls apiClient only)
3. Create slice `src/store/slices/<resource>Slice.ts` (state + AsyncThunks)
4. Register slice reducer in `src/store/index.ts`
5. Create hook `src/hooks/use<Resource>.ts` (wraps useSelector + useDispatch)
6. Build page/components in `src/pages/<Resource>/` or `src/components/`

### Error handling
- Service functions throw `ApiError` (from apiClient.ts) on non-2xx responses
- Thunks catch `ApiError` and call `rejectWithValue(error.message)`
- Hooks expose `error: string | null` to components
- Components display error string — never the raw error object

### State rules
- Redux: state shared across routes (auth, users list, global UI)
- useState: local component state (form fields, toggles, open/close)
- Never store derived data in Redux — compute in selectors

### Naming
| Thing | Pattern | Example |
|---|---|---|
| Component | PascalCase | `UserCard.tsx` |
| Hook | camelCase + `use` prefix | `useUserData.ts` |
| Slice | camelCase + `Slice` | `usersSlice.ts` |
| Service | camelCase + `Service` | `userService.ts` |
| Type/Interface | PascalCase | `User`, `LoginCredentials` |
| CSS Module | `<Component>.module.css` | `Button.module.css` |

## Environment
- Dev: `npm start` (CRA dev server on port 3000)
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Format: `npm run format`
- Env file: `.env` (copy from `.env.example`)
- Key env var: `REACT_APP_API_BASE_URL`

## Skills available
All skills are in `frontend/skills/` at the repo root. Reference them in task XMLs via:
`<skill>frontend/skills/react-best-practices/SKILL.md</skill>`

## Current milestone
[ ] Define here when starting a new milestone
