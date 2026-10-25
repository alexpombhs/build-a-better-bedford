# Engineering Lab Starter

A lightweight, mobile-friendly starter site for the Build a Better Bedford student civil engineering club.

## What's included
- Home, mission, project cards, and sample activities
- Interactive **cable tension** simulator: symmetric two-cable equilibrium, with T = W / (2 sin θ)
- Interactive **bridge shapes** comparison: beam, truss, arch, suspension
- Responsive design; no npm, servers, logins, API keys, or paid services needed

## Preview
Open `index.html` in any modern browser.

## Publishing
This prototype lives in `engineering-lab-starter/` on branch `feature/engineering-lab-starter` and does **not** replace the current website.

To publish without altering the current website, you can configure GitHub Pages to deploy a separate branch or migrate the prototype into a dedicated repository. For this repository, the main website's existing deployment should be left unchanged until you're ready.

## Editing
- Change project names and descriptions in the HTML section with id `projects`.
- Replace the sample club activities in `activities`.
- Adjust fonts/colors at the top of the `<style>` section.
- Add more calculators as additional sections using the existing `lab-card` pattern.

## Physics assumptions
Cable model assumes a stationary point load, two equal straight cables, symmetric geometry, angle above horizontal, and no cable weight. The illustration is schematic. It is not for engineering design or safety decisions.

Bridge shape explorer provides conceptual load-path explanations, not strength calculations.

## Future ideas
Meeting calendar, project gallery with photos, bridge load and deflection simulator with clearly stated assumptions, club membership form, admin content editing, and student challenges.
