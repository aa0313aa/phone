# DNS TXT Verification (examples)

Add a DNS TXT record to verify domain ownership. Use the exact token provided by Search Console.

Example record:

- Host / Name: @
- Type: TXT
- Value: google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXX
- TTL: 3600 (or default)

Registrar notes:

- Cloudflare: Go to DNS panel -> Add record -> Type TXT -> Paste value. Wait for propagation.
- GoDaddy: DNS Management -> Add -> TXT -> Host=@ -> Paste value.
- Cafe24 / Naver DNS: Use the domain DNS management UI to add the TXT record.

After adding, return to Search Console and click "Verify". DNS changes may take minutes to hours.
