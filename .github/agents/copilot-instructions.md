# tipsligan-2026-app Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-19

## Active Technologies

- TypeScript 5.x (frontend), .NET 9 (backend API) + React 19.x, FluentUI 9 (@fluentui/react-components), Redux Toolkit 2.x, Axios, React Router 7.x, Vite (002-weekly-betting)
- SQL Server via .NET 9 backend (existing) (002-weekly-betting)

- TypeScript 4.9+ (strict mode), React 19.x (001-chronicle-admin-comments)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 4.9+ (strict mode), React 19.x: Follow standard conventions

## Recent Changes

- 002-weekly-betting: Added TypeScript 5.x (frontend), .NET 9 (backend API) + React 19.x, FluentUI 9 (@fluentui/react-components), Redux Toolkit 2.x, Axios, React Router 7.x, Vite

- 001-chronicle-admin-comments: Added TypeScript 4.9+ (strict mode), React 19.x

<!-- MANUAL ADDITIONS START -->

# Tipsligan 2026 App Constitution

_Version 1.1.0 | Last Amended: 2026-02-20_

## Core Principles

### I. Type Safety First (NON-NEGOTIABLE)

- **100% TypeScript coverage** - No `any` types without explicit justification and documentation
- All components, services, hooks, and utilities must have complete type definitions
- Strict TypeScript compiler settings must be maintained (`strict: true`)
- Interface definitions for all API responses, Redux state, and component props
- Type guards for runtime data validation when consuming external APIs
- Zero TypeScript compilation errors at all times

### II. Component Architecture

- **Functional components only** - No class components; use React Hooks for state and lifecycle
- **Single Responsibility** - Each component should have one clear purpose
- **Composition over inheritance** - Build complex UIs from small, reusable components
- **Props interface required** - Every component must define its props interface explicitly
- **FluentUI 9 components preferred** - Use design system components before custom implementations
- **Responsive by default** - All components must work on desktop, tablet, and mobile (≥320px width)

### III. State Management

- **Redux Toolkit for global state** - Use `createSlice`, `createAsyncThunk` for standardized patterns
- **Local state for UI-only concerns** - Use `useState` for component-specific UI state
- **Single source of truth** - Avoid duplicating state between Redux and local state
- **Immutable updates** - Redux Toolkit's Immer integration ensures immutability
- **Normalized state shape** - Related data stored by ID with lookup tables
- **Smart caching strategy** - Cache API responses to minimize redundant network calls

### IV. User Experience Excellence

- **Mobile-first design** - Develop for mobile, enhance for desktop
- **Responsive navigation** - Burger menu for mobile (<768px), sidebar for desktop
- **Loading states** - Show `Spinner` components during async operations
- **Error handling** - User-friendly error messages, never expose technical details
- **Accessibility** - Use semantic HTML, ARIA labels, keyboard navigation support
- **Smooth animations** - FluentUI motion tokens for consistent transitions

### V. Code Quality Standards

- **Clean, readable code** - Self-documenting variable/function names
- **DRY principle** - Extract reusable logic into hooks, utilities, or services
- **Consistent formatting** - Follow project's ESLint configuration
- **Meaningful comments** - Explain "why" not "what"; document complex logic
- **File organization** - Related files grouped in logical directories (`components/`, `hooks/`, `pages/`, `services/`, `store/`, `types/`, `utils/`)
- **Import order** - External libraries → React → Local imports, alphabetically within groups

### VI. API Request Management (NON-NEGOTIABLE)

- **No duplicate concurrent requests** - Prevent sending multiple requests to the same API endpoint simultaneously
- **Request deduplication** - Implement request tracking to detect and block duplicate in-flight requests
- **Request cancellation** - Cancel pending requests when components unmount or dependencies change
- **Debouncing for user input** - Debounce search/filter requests triggered by user typing (minimum 300ms)
- **Loading state coordination** - Use loading flags to prevent multiple submissions of the same action
- **Redux thunk patterns** - Leverage `createAsyncThunk` with proper pending/fulfilled/rejected states
- **Error retry logic** - Implement exponential backoff for failed requests, not immediate retry loops
- **Request batching** - Batch related requests when possible to reduce network overhead
- **Cache-first strategy** - Check Redux cache before making API calls; use force refresh flags when needed

**Rationale**: Duplicate requests waste bandwidth, create race conditions, cause inconsistent UI states, and can overwhelm backend services. This principle ensures efficient, predictable API interactions and prevents common bugs related to rapid user interactions or component re-renders triggering redundant API calls.

### VII. Development Workflow

#### Feature Development (Spec-Kit)

1. **Plan before coding** - Use Spec-Kit workflow (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`)
2. **Create feature branch** - Branch from `main` with descriptive name (`feature/user-leaderboard`)
3. **Implement incrementally** - Small, focused commits with clear messages
4. **Test as you go** - Write tests alongside implementation
5. **Review changes** - Self-review diff before committing
6. **Document updates** - Update relevant `.md` files for significant changes

#### Code Review Standards

- **Zero compilation errors** - Must build successfully
- **Type safety verified** - No `any` types without justification
- **Follows component patterns** - Consistent with existing codebase
- **Responsive design validated** - Test on multiple screen sizes
- **Performance considered** - No unnecessary re-renders or expensive operations
- **Error handling present** - User-facing operations handle failures gracefully

#### Quality Gates

- ✅ TypeScript compilation succeeds without errors
- ✅ ESLint passes without warnings (unless explicitly documented)
- ✅ Application runs without console errors
- ✅ Responsive design works on mobile and desktop
- ✅ Authentication flow functions correctly
- ✅ Redux state updates follow patterns
- ✅ API calls use centralized APIManager

### VIII. Security & Data Handling

#### Authentication Security

- **No passwords in code** - Never hardcode credentials
- **Token management** - Store in `sessionStorage`, clear on logout
- **Protected routes** - Redirect to login if unauthorized
- **Secure API calls** - Include auth token in headers for protected endpoints
- **Session expiration** - Handle token expiration gracefully

#### Data Validation

- **Validate API responses** - Type guards for runtime validation
- **Sanitize user input** - Prevent XSS, validate form inputs
- **Error boundaries** - Catch and display errors without crashing app
- **Defensive programming** - Check for null/undefined before accessing properties

### IX. Performance Standards

#### Bundle Size

- **Code splitting** - Use React.lazy for route-based splitting
- **Tree shaking** - Import only what's needed from libraries
- **Asset optimization** - Compress images, lazy load non-critical resources

#### Runtime Performance

- **Efficient re-renders** - Use `useMemo`, `useCallback` for expensive operations
- **Virtualization** - For long lists (e.g., match listings, standings)
- **Debounce/throttle** - For search inputs, resize handlers
- **Cache API responses** - Implement smart caching in Redux store

#### User-Perceived Performance

- **Loading indicators** - Show feedback for operations >200ms
- **Optimistic updates** - Update UI immediately, sync with server
- **Smooth animations** - Use CSS transitions, avoid janky animations
- **Fast initial load** - Critical CSS inline, defer non-critical scripts

## Governance

### Constitutional Authority

- This constitution supersedes individual preferences and ad-hoc decisions
- All code changes must comply with these principles
- Deviations require explicit documentation and justification
- For complex decisions, document reasoning in commit messages or markdown files

### Compliance Verification

- Pre-commit: Run TypeScript compiler and ESLint
- Development: Monitor console for errors/warnings
- Review: Verify constitutional compliance in code reviews
- Continuous: Maintain zero TypeScript errors policy

<!-- MANUAL ADDITIONS END -->
