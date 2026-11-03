/** Original CSS-built scene using the existing project logo, with no third-party artwork. */
export function brandScene() {
  const cube = name => `<span class="scene-cube ${name}"><i></i><i></i><i></i></span>`;
  return `<div class="brand-scene" aria-hidden="true"><span class="scene-halo"></span><span class="scene-orbit"></span><span class="scene-orbit second"></span>${cube('cube-a')}${cube('cube-b')}${cube('cube-c')}<span class="scene-disc"></span><img class="scene-logo" src="/assets/logo.png" width="112" height="112" alt=""><span class="scene-chip chip-a">APLEJOUICE</span><span class="scene-chip chip-b">BUILT FOR YOUR GAME</span></div>`;
}
