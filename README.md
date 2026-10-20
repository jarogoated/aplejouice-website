# Aplejouice Mod — Website

Buildless website. Serve `dist/` with any static web server. No npm dependencies or build step.

Design: original dark/orange Aplejouice treatment inspired by the visual direction of the user-supplied vape.gg reference. All copy describes Aplejouice features; no reference branding or illustrations were copied.

Includes a browser-local counter demo, keyboard-accessible screenshot tabs, responsive layouts, installation instructions and native FAQ disclosures. The demo does not connect to Minecraft or send tracking data.

## Hero artwork

Saved asset: `dist/assets/hero-character.png`.
Created with the built-in image_gen tool using the imagegen skill. Original transparent illustration, separate from in-game screenshots.

Final generation prompt:

Use case: stylized-concept. Asset type: transparent hero illustration for the Aplejouice Minecraft mod website. Create an original high quality cinematic 3D voxel Minecraft adventurer with cuboid head, brown hair, warm orange hoodie with cream trim, charcoal trousers and white shoes, confidently in a dynamic mid-air combat stance, holding a glowing golden-orange pixel sword diagonally up toward the upper left in one hand and a small teal ender pearl in the other. Full body visible, three-quarter view, character oriented slightly toward the left. Floating few golden cubes and small subtle orange spark particles around the character, warm amber rim lighting, subtle cool secondary light, polished blocky materials, dramatic crisp shadows. Character centered, isolated genuinely transparent background, suitable overlay on almost black website, no ground plane, no environment, no text, no logos, no crown, no watermark. Render at high detail with clean recognizable block geometry; square composition with room around sword and feet.

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
