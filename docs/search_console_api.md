# Automating Sitemap Submission (Search Console API)

Overview:
- You can programmatically submit sitemaps and manage search console properties via the Google Search Console API.
- For automation (CI), create a Google Cloud service account, grant access to your Search Console property, and store the service account JSON in GitHub Secrets.

High-level steps:
1. Create a Google Cloud project and enable the Search Console API.
2. Create a service account and generate a JSON key.
3. In Search Console, add the service account email as an owner (or add via domain property ownership verification).
4. Store the JSON key as a GitHub Secret (e.g., `GSC_SERVICE_ACCOUNT_JSON`).
5. Use a small Python script (google-api-python-client) to submit a sitemap URL.

Note: Automating submission requires correct project and permission configuration and cannot be performed purely from the repo without granting the service account access.
