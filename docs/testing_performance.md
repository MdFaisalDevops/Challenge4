# Testing and Performance Report

This document reports the performance characteristics and automated testing topology of **CrowdMind AI**.

---

## 🏎️ Performance Optimizations

Both front-end and back-end services are optimized to run efficiently under heavy usage, reducing cloud database billing and layout rendering overhead.

### 1. In-Memory Request Caching
- **Memory Cache Middleware:** Intercepts GET requests on endpoints like `/transportation`, `/volunteers`, and `/crowd-reports`. It caches payloads in memory for 5 seconds to reduce redundant database queries.
- **Cache Invalidation:** The caching engine is cleared when database writes occur, ensuring operators always see fresh information.

### 2. Next.js Code Splitting
- **Dynamic Imports:** The heavy Google Maps script is lazy-loaded using `next/dynamic` with SSR disabled. This reduces the initial page load bundle size and improves Time-to-Interactive (TTI) metrics.

### 3. React Rendering Optimization
- Derived calculations (like formatting tables or priority categories) are wrapped in `useMemo` hooks.
- Click callbacks (such as routing triggers) are memoized using `useCallback` to prevent child component re-renders.

---

## 🧪 Testing Coverage Topology

Automated tests verify backend code, frontend rendering, APIs, and accessibility guidelines:

```
├── apps/
│   ├── server/
│   │   └── tests/
│   │       ├── unit/
│   │       │   └── queryHelper.test.ts   # Paging limit & offset tests
│   │       └── api/
│   │           └── health.test.ts        # Mocked DB endpoint checks
│   └── web/
│       └── tests/
│           └── integration/
│               └── AuthGuard.test.tsx    # Auth Guard redirect tests
└── tests/
    └── e2e/
        └── operations.spec.ts            # E2E Playwright & Axe audits
```

### Running Tests:
- Run Jest tests:
  ```bash
  npm run test --workspaces
  ```
- Run E2E and visual tests:
  ```bash
  npx playwright test
  ```
