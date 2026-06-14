# Deploying Documentation to GitHub Pages

This guide explains how to deploy the Docusaurus documentation site to GitHub Pages.

## Automatic Deployment (Recommended)

GitHub Actions automatically builds and deploys docs when you push to `main`.

### Initial Setup

1. **Enable GitHub Pages**
   - Go to your repo: Settings → Pages
   - **Source:** Deploy from a branch
   - **Branch:** `gh-pages` (will be created automatically)
   - **Folder:** `/ (root)`
   - Click **Save**

2. **Configure Docusaurus**
   - Edit `packages/docs/docusaurus.config.js`
   - Set your GitHub username in `organizationName`
   - Set `projectName` to your repo name
   - Set `url` to your GitHub Pages URL

   Example:
   ```javascript
   organizationName: 'yourusername',
   projectName: 'voice-agent',
   url: 'https://yourusername.github.io',
   baseUrl: '/voice-agent/',
   ```

3. **GitHub Actions Configuration**
   - Workflow already in place: `.github/workflows/deploy-docs.yml`
   - Runs on push to `main`
   - Automatically builds and deploys to `gh-pages` branch

### Deploy

```bash
# Commit your docs changes
git add packages/docs/docs/
git commit -m "docs: add my new page"

# Push to main
git push origin main

# GitHub Actions will automatically:
# 1. Build the docs
# 2. Deploy to gh-pages branch
# 3. Update your GitHub Pages site
```

**Site will be live at:** `https://yourusername.github.io/voice-agent/`

Check the Actions tab in GitHub to monitor the deployment.

## Manual Deployment

If you prefer to build and deploy manually:

### Build Locally

```bash
npm run docs:build --workspace=docs
```

Output: `packages/docs/build/`

### Deploy with GitHub CLI

```bash
# Install GitHub CLI (https://cli.github.com)
gh auth login

# Deploy the build directory
gh release upload docs --cwd packages/docs/build/

# Or use the deploy command
npm run docs:deploy --workspace=docs
```

### Deploy with Git

```bash
# Build
npm run docs:build --workspace=docs

# Create orphan gh-pages branch (first time only)
git checkout --orphan gh-pages
git rm -rf .

# Copy build files
cp -r packages/docs/build/* .

# Commit and push
git add .
git commit -m "docs: deploy to GitHub Pages"
git push origin gh-pages

# Switch back to main
git checkout main
```

## Troubleshooting

### Site Not Updating

1. Check GitHub Actions tab for errors
2. Verify `gh-pages` branch exists
3. Verify GitHub Pages setting points to `gh-pages` branch
4. Wait 1-2 minutes for deployment

### 404 on Subpages

**Cause:** `baseUrl` is wrong

**Fix:**
- If repo is `yourusername/voice-agent`
- Set `baseUrl: '/voice-agent/'` (not `/`)

### Custom Domain

To use a custom domain (e.g., `docs.example.com`):

1. Add CNAME file to `packages/docs/static/`:
   ```
   docs.example.com
   ```

2. Configure DNS to point to GitHub Pages
   - See [GitHub docs on custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

3. Enable in repo settings: Settings → Pages → Custom domain

## Monitoring Deployments

View all deployments:

```bash
# See recent deployments
gh deployment list --repo yourusername/voice-agent

# View deployment logs
gh run list --workflow=deploy-docs.yml
```

## CI/CD Integration

The workflow automatically:

- ✅ Builds on push to `main`
- ✅ Builds on PRs (preview generated)
- ✅ Deploys to `gh-pages` on main merge
- ✅ Caches dependencies for speed
- ✅ Fails build if docs have errors

## Environment Variables

If you need to pass environment variables to the build:

Edit `.github/workflows/deploy-docs.yml`:

```yaml
- name: Build documentation
  env:
    CUSTOM_VAR: value
  run: npm run docs:build --workspace=docs
```

## Performance

- **Build time:** ~30-60 seconds
- **Deploy time:** ~1-2 minutes
- **Site updates:** Usually within 2-3 minutes of push

## Rollback

To revert to a previous docs version:

```bash
# Find the commit hash of the previous docs
git log --oneline packages/docs/

# Revert that file
git revert <commit-hash>

# Push to trigger redeploy
git push origin main
```

## Next Steps

- 📖 [Start writing docs](README.md)
- 🎨 [Customize the site](README.md#customization)
- 🔄 [Set up versioning](README.md#versioning)
- 📝 [Contributing guide](../CONTRIBUTING-DOCS.md)

---

**Questions?** See [Docusaurus deployment guide](https://docusaurus.io/docs/deployment)
