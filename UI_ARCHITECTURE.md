# UI architecture and migration status

## Component hierarchy
- **Atoms**: `src/components/atoms/MuiPrimitives.tsx`. These are the *only* allowed direct MUI imports for primitives used by the engineering lab. Each injects a stable internal `bbb-ui-*` CSS class and forwards MUI props.
- **Molecules**: `src/lab/LabUI.tsx` owns reusable LabCard, LabSlider, LabTabs and SectionHeading composites; it imports atoms, not MUI.
- **Organisms**: `src/EngineeringLab.tsx` assembles the beam simulator, lab prompts and hands-on activities from those molecules.
- **Pages**: `src/App.tsx` selects the Projects sub-tab and keeps existing Ideas data/form behavior. `src/Newsletter.tsx` owns issue navigation.
- **Theme**: `src/components/AppTheme.tsx` centralizes MUI tokens; `src/main.tsx` mounts it.

## Standards
1. No new direct `@mui/material` component imports outside the atoms or the theme setup.
2. Wrappers must add an internal class name, permit caller-supplied `className`, and forward accessibility and control props.
3. Shared component appearance goes into the theme or wrappers, not arbitrary page-level `sx`.
4. Simulator math belongs in dedicated logic/tests as complexity grows; SVG is a visualization, not a structural design tool.
5. Verify `npm install` and `npm run build`, then test desktop/mobile including keyboard access, slider updates, issue navigation and responsive layouts.

## Existing site status
The homepage, Projects idea cards/modal, site header, and Newsletter predate MUI and still use native elements plus CSS. Those **have not been fully converted** to MUI atoms/molecules. Preserve their approved visual layouts while migrating them gradually into shared wrappers; don't claim full-site compliance until completed.
