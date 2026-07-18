# Production Launch Readiness Checklist

This checklist verifies that the monorepo workspaces and Cloud Run hostings meet code quality, security, and operations guidelines before going live.

---

## 💻 1. Code Quality & Pre-Commit Checks

- [ ] **Workspace Compilation:** Clean compile runs across all projects without TypeScript errors.
  ```bash
  npm run build --workspaces
  ```
- [ ] **Linter Audits:** ESLint runs pass without warnings.
  ```bash
  npm run lint --workspaces
  ```
- [ ] **Test Coverage:** All unit, integration, API, and E2E specs pass successfully.
  ```bash
  npm run test --workspaces
  npx playwright test
  ```

---

## 🔒 2. Security Audits & Keys Controls

- [ ] **Production Env Values:** Check that `.env` does not contain default development strings.
- [ ] **Secret Manager Mapping:** Store sensitive API keys like `GEMINI_API_KEY` in Google Secret Manager, rather than using raw environment configuration values.
- [ ] **HTTPS Redirection:** Check that Cloud Run redirect parameters are active and Helmet secure headers are set.
- [ ] **CORS Origins:** Set Allowed CORS origins to target the frontend client domain, rather than using wildcard values.

---

## ⚙️ 3. Operations Infrastructure & Monitoring

- [ ] **Artifact Registry:** Docker repository is configured in the target production region.
- [ ] **IAM Permissions:** Grant the Compute Engine/Cloud Run service account Secret Manager Accessor roles.
- [ ] **Uptime Alarms:** Set up Google Cloud Monitoring uptime checks targeting the `/health` endpoint.
- [ ] **Structured Logging:** Structured JSON Morgan logs are routing correctly to Google Cloud Logging.
- [ ] **Scale Limits:** Configure Cloud Run concurrency parameters (e.g. limit to maximum 10 container instances) to prevent runaway scaling billing charges.
