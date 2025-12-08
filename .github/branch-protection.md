Branch protection recommendations for `main`

1. Location: Repository → Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Recommended options:
   - Require pull request reviews before merging (1 or 2 reviewers)
   - Require status checks to pass before merging
     - Select CI checks such as `Blog SEO validation`, `CodeQL`, and any unit test jobs
   - Require branches to be up to date before merging (optional)
   - Include administrators (optional but recommended)
   - Restrict who can push to matching branches (optional)
4. Protect against secret leaks:
   - Enable "Require linear history" to avoid merge commits if desired
   - Use Organization-level "Push protection" if available to block pushes containing secrets

Check list after enabling:

- Code scanning (CodeQL) appears as a required status check on PRs
- Dependabot PRs are created and assigned reviewers
- Secret scanning alerts appear in Security → Secret scanning alerts

If you want, I can prepare a checklist PR template or a GitHub Actions job to auto-label Dependabot PRs.
