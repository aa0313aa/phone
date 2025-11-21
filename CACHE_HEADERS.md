Netlify _headers example

Place this file at the site root (named `_headers`) to set long cache TTLs for static assets:

```
/assets/img/*
  Cache-Control: public, max-age=31536000, immutable
/assets/css/*
  Cache-Control: public, max-age=31536000, immutable
/assets/js/*
  Cache-Control: public, max-age=31536000, immutable
/favicon.ico
  Cache-Control: public, max-age=31536000, immutable
```

Nginx example (add to server block):

```
location ~* \.(?:png|jpg|jpeg|gif|webp|svg|ico)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

location ~* \.(?:css|js)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

Apache (.htaccess) example:

```
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
```

GitHub Pages note:
- GitHub Pages doesn't support custom response headers. Use a CDN (Cloudflare, Netlify) in front to set caching headers.

Instruction:
- After deploying, verify headers with `curl -I https://your-site.example/assets/img/blog/1.webp`.
