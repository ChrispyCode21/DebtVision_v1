## What and why

<!-- What changed, which issue it closes, and which SPEC.md section it traces to. -->

## Checklist

CI checks lint, types, unit tests, the production build, a production dependency audit, CodeQL and dependency review. These need a human:

- [ ] One slice: one issue, one behavior. Under 300 changed lines (not counting tests, lockfiles and generated files), or split.
- [ ] Builds only to what the spec says; anything it doesn't cover was asked about first.
- [ ] The spec is updated for any decision made.
- [ ] Engine changes (`src/engine/`) come with tests, including a hand-computed worked example.
- [ ] Stored-data changes (`src/services/storage`) keep old saved data loading.
- [ ] UI changes were looked at at phone width.
