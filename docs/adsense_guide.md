# Google AdSense — Quick Steps

1. Sign in to Google AdSense and add your site using the punycode domain: `xn--2p7b1pl7d.shop`.
2. AdSense may request site ownership verification — complete via Search Console (DNS or HTML tag).
3. Ad code: after AdSense approves, add the provided `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>` to the `<head>` and place ad units where desired.
4. Replace `data-ad-slot` placeholders in HTML with your ad unit IDs.

Where to insert:

- Global script: in `index.html` head (already a placeholder meta exists).
- Unit slots: any `ins class="adsbygoogle"` elements; replace `data-ad-slot="REPLACE_ME"` with your numeric unit ID.

Safety notes:

- Make sure the domain submitted to AdSense is the punycode form.
- Allow up to 48 hours for AdSense review and crawler recheck.
