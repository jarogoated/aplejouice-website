# Aplejouice Mod — Website

Buildless website. Serve `dist/` with any static web server. No npm dependencies or build step.

Design: original dark/orange Aplejouice treatment inspired by the visual direction of the user-supplied vape.gg reference. All copy describes Aplejouice features; no reference branding or illustrations were copied.

Includes a browser-local counter demo, keyboard-accessible screenshot tabs, responsive layouts, installation instructions and native FAQ disclosures. The demo does not connect to Minecraft or send tracking data.

## Visuals

The current website uses the project logo, native pixel icons and real in-game screenshots from the mod. The generated hero character has been removed. System fonts are used, with no external font requests.

## Validation

- JavaScript syntax check passed.
- Local HTTP preview returned 200.
- Four item counters, round reset, screenshot tabs, arrow-key tab navigation and FAQ opening checked in the browser.
- Desktop and 390px mobile layout inspected.

## Hosting

### Vercel

Import `jarogoated/aplejouice-website` into Vercel with the repository root as the Root Directory. `vercel.json` installs the pinned middleware dependency and serves `dist/` without a build step.

The root middleware protects pages and assets with a server-verified passcode. Configure `SITE_ACCESS_CONFIG` as a secret environment variable containing JSON with a random 16-byte hexadecimal `salt`, a 32-byte hexadecimal scrypt `hash` of the passcode using that salt, and a separate random 32-byte hexadecimal signing `key`. Never commit the live configuration or passcode. Missing configuration fails closed. Sessions expire after eight hours and use a signed, host-bound, Secure/HttpOnly/SameSite cookie. Invalid login attempts are limited per IP within each running instance; this is not a global distributed rate limit.

Run `npm test` to check the access boundary, invalid/expired/tampered sessions, login origin checks, and logout. The public holding page says “In Bearbeitung · Beta” and links to Modrinth. The only public project asset is the logo.

### Sites

Site identity and static deployment configuration are in `.openai/hosting.json`. Source synchronization and deployments use the Sites plugin helpers. Credentials are supplied through session stdin only.
