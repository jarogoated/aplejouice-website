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

Import `jarogoated/aplejouice-website` into Vercel with the repository root as the Root Directory. `vercel.json` selects the Other/static preset, skips install/build commands, and serves the existing `dist/` directory. No environment variables are required. Deployment access is configured separately in the Vercel project settings.

### Sites

Site identity and static deployment configuration are in `.openai/hosting.json`. Source synchronization and deployments use the Sites plugin helpers. Credentials are supplied through session stdin only.
