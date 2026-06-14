# Gallerybook TODO

Use this file to track bugs, features, and cleanup work that should stay visible
between coding sessions.

## How To Use

- Add new items under `Backlog` with the next ID.
- Use `bug`, `feature`, `chore`, or `question` as the item type.
- Move active work to `In Progress`.
- Move completed work to `Done` with the completion date and commit hash when available.
- When asking Codex to work on an item, reference its ID, for example:
  `Implement TODO-0003`.

## Template

```md
- [ ] TODO-0000 `type` Short title
  - Context:
  - Expected:
  - Notes:
```

## In Progress

No active items.

## Backlog

- [ ] TODO-0001 `feature` Navigate away from editor after successful gallery save
  - Context: After editing a gallery, saving successfully returns to the editor
    still in edit mode.
  - Expected: Successful edit save should close the save dialog and navigate to
    the read-only gallery view.
  - Notes: Use `/galleries/:slug` when available, with ID fallback.

- [ ] TODO-0002 `feature` Display tags in gallery view
  - Context: Tags are visible on gallery cards but not on the read-only gallery
    detail page.
  - Expected: Gallery tags should be visible when viewing a gallery.
  - Notes:

- [ ] TODO-0003 `feature` Consider implementing folders
  - Context: Galleries may need a higher-level organization model beyond tags.
  - Expected: Evaluate whether folders should be added and what UX/data model
    they require.
  - Notes:

- [ ] TODO-0004 `bug` Show delete progress from gallery card menu
  - Context: In Galleries view, deleting from the gallery card three-dot menu has
    no visual progress indication before the card disappears.
  - Expected: Deleting should show immediate feedback, such as a disabled menu
    item, spinner, optimistic pending state, or loading overlay.
  - Notes:

## Done

No completed items yet.
