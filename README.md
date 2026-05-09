# testdokdeploy

Simple Express server deployed to a GCP VM via [Dokploy](https://dokploy.com), with GitHub auto-deploy on push.

## Architecture

```
GitHub repo  ──push──▶  GitHub webhook  ──▶  Dokploy (on GCP VM)  ──▶  builds Dockerfile  ──▶  serves via Traefik
   │
   └── PR ──▶ GitHub Actions CI (npm test + docker build)
```

- **CI** (test + build verification): GitHub Actions, `.github/workflows/ci.yml`
- **CD** (deploy on push to `main`): Dokploy auto-deploy via GitHub webhook — no GitHub Actions deploy step needed.

## Local development

```bash
npm install
npm run dev      # node --watch
npm test
```

Server listens on `http://localhost:3000`. Endpoints:
- `GET /` → greeting JSON
- `GET /health` → `{ status: "ok" }`

Docker:
```bash
docker build -t testdokdeploy .
docker run -p 3000:3000 testdokdeploy
```

## Deployment: Dokploy on GCP

### 1. Create the GCP VM

```bash
gcloud compute instances create dokploy \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=http-server,https-server \
  --zone=us-central1-a

# Open ports 80, 443, and 3000 (Dokploy UI)
gcloud compute firewall-rules create dokploy-ports \
  --allow=tcp:80,tcp:443,tcp:3000 \
  --target-tags=http-server,https-server
```

Minimum spec per Dokploy docs: 2 GB RAM, 30 GB disk.

### 2. Install Dokploy

SSH into the VM and run the installer:

```bash
gcloud compute ssh dokploy --zone=us-central1-a
```

```bash
curl -sSL https://dokploy.com/install.sh | sudo sh
```

Once installed, open `http://<VM-EXTERNAL-IP>:3000` in a browser and create your admin account.

### 3. Connect GitHub

In the Dokploy UI:

1. **Settings → Git → GitHub** → click **Install GitHub App** and authorize the repo.
2. **Projects → Create Project** → name it `testdokdeploy`.
3. **Add Application** → **Source: GitHub** → select this repo, branch `main`.
4. **Build Type: Dockerfile** → path `Dockerfile`, context `.`.
5. **Deploy** to run the first build.

### 4. Enable auto-deploy on push

In the application's **General** tab, toggle **Auto Deploy** ON. Dokploy installs the webhook on the GitHub repo automatically when you use the GitHub App integration — no manual webhook setup needed.

> If you used a personal access token instead of the GitHub App, copy the webhook URL from the deployment logs and add it manually under GitHub repo **Settings → Webhooks**.

### 5. Add a domain (optional)

In **Domains**, add your domain pointing to the VM's IP and toggle **HTTPS** — Dokploy provisions a Let's Encrypt cert via Traefik. The container exposes port 3000; Dokploy routes external 80/443 to it.

## Environment variables

Set runtime vars in the Dokploy app's **Environment** tab. The app reads `PORT` (defaults to 3000) — leave it unset and let Dokploy/Traefik handle routing.

## CI on pull requests

`.github/workflows/ci.yml` runs `npm test` and a Docker build on every PR to `main`. Push to `main` triggers Dokploy auto-deploy.
