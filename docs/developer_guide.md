# Developer Setup Guide

This guide details the commands and specifications required to edit, validate, and write features on the **CrowdMind AI** codebase.

---

## 🛠️ Monorepo Operations Commands

All dependencies and commands are controlled via the root workspace configurations. Avoid cd'ing into subfolders directly to compile modules. Use the workspace commands:

### Workspace Run Triggers:
- **Build all workspace targets:**
  ```bash
  npm run build --workspaces
  ```
- **Execute linter validations:**
  ```bash
  npm run lint --workspaces
  ```
- **Run all Jest unit, integration, and API tests:**
  ```bash
  npm run test --workspaces
  ```

---

## 💅 Code Quality Standards

ESLint and Prettier are configured to run automatically before code commits:

### Eslint configurations:
- Backend: Exclude `any` values where possible, enforce absolute type parameters on routes, and restrict raw response binds.
- Frontend: Restrict React RC hooks dependencies cycles, forbid raw React `dangerouslySetInnerHTML` values, and validate accessibility tags.

### Prettier style guidelines:
- Double quotes on strings inside JSX, single quotes on typescript code: `singleQuote: true`.
- Trailing commas: `trailingComma: 'es5'`.
- Indentation widths: 2 spaces.

---

## 📈 Feature Development Workflow

When adding new operational collections (e.g., adding dynamic weather alert sensors or concession queue lines):

1. **Schema Definition:**
   - Define interfaces inside [packages/shared/src/index.ts](file:///f:/Challenge%204/packages/shared/src/index.ts).
   - Export type guards or schemas.
2. **Backend API Route:**
   - Create router files inside `apps/server/src/routes/`.
   - Mount routes in [apps/server/src/index.ts](file:///f:/Challenge%204/apps/server/src/index.ts).
   - Enforce HTML sanitizers and authentication guards.
3. **Frontend Subviews:**
   - Append render elements inside [apps/web/src/components/DashboardViews.tsx](file:///f:/Challenge%204/apps/web/src/components/DashboardViews.tsx).
   - Ensure screen reader tags (`aria-label`, `role="region"`) accompany new containers.
