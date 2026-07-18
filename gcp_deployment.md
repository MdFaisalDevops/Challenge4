# Google Cloud Platform (GCP) Deployment Manual

This manual details the steps required to provision, secure, deploy, and monitor the **CrowdMind AI** services on Google Cloud Platform.

---

## 1. Initial Setup and APIs Provisioning

Ensure the `gcloud` CLI is installed and authenticated:
```bash
gcloud auth login
gcloud config set project [YOUR_PROJECT_ID]
```

Enable the necessary APIs:
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com
```

---

## 2. Docker Artifact Registry Setup

Create a repository named `crowdmind-repo` in the target region (`us-central1`):
```bash
gcloud artifacts repositories create crowdmind-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="CrowdMind AI Docker Images Repository"
```

Configure docker client locally if performing direct manual builds:
```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## 3. Secret Manager Provisioning

Store the sensitive model keys and Firebase credentials inside Secret Manager:

```bash
# Create GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "your_api_key_here" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

### Grant Cloud Run Access to Secrets
Find the default Compute Engine service account or Cloud Run service account, and grant the **Secret Manager Secret Accessor** role:

```bash
PROJECT_NUMBER=$(gcloud projects describe [YOUR_PROJECT_ID] --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Manual Cloud Build Deployment

To trigger the build and deploy pipeline manually using Cloud Build:

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_API_URL="https://crowdmind-server-[hash].a.run.app",_GOOGLE_MAPS_KEY="AIzaSy..." \
  --verbosity=info
```

---

## 5. Automated CI/CD Setup (GitHub Actions)

To connect your GitHub repository using **Workload Identity Federation**:

1. Create a Workload Identity Pool:
   ```bash
   gcloud iam workload-identity-pools create "github-actions-pool" \
     --location="global" \
     --description="Pool for GitHub Action runners"
   ```
2. Create an OIDC provider inside the pool:
   ```bash
   gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" \
     --workload-identity-pool="github-actions-pool" \
     --location="global" \
     --issuer-uri="https://token.actions.githubusercontent.com" \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"
   ```
3. Grant the Actions provider roles/iam.workloadIdentityUser access to a dedicated GCP Deployment Service Account.
4. Save variables as secrets in your GitHub repository:
   - `GCP_PROJECT_ID`
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`: `projects/[PROJECT_NUMBER]/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider`
   - `GCP_SERVICE_ACCOUNT`: Dedicated deployment service account email.
   - `NEXT_PUBLIC_API_URL`: Backend Cloud Run endpoint.
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## 6. Logging and Operations Monitoring

### Logging:
- All Winston log entries are written in structured JSON formatting to `stdout`/`stderr`.
- Google Cloud Logging automatically registers these logs, parse metadata levels, and formats them in the log explorer cockpit.

### Monitoring Alerts & Uptime Checks:
1. Go to the **Google Cloud Monitoring Console**.
2. Select **Uptime Checks** -> **Create Uptime Check**.
   - Target: `HTTPS` Uptime Check.
   - Resource: Cloud Run service endpoints.
   - Path: `/health` (backend server) or `/` (frontend client web).
3. Setup **Alerting Policies**:
   - Condition: Trigger alarm if uptime checks fail or resource memory utilization exceeds 85% for more than 5 minutes.
   - Notification Channel: Add email or Slack integration hook endpoints to wake operators on operational incidents.
