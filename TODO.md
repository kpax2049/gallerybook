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

- [ ] TODO-0003 `feature` Consider implementing folders
  - Context: Galleries may need a higher-level organization model beyond tags.
  - Expected: Evaluate whether folders should be added and what UX/data model
    they require.
  - Notes:

- [ ] TODO-0005 `feature` Add breadcrumbs to gallery editor page
  - Context: The gallery editor page needs breadcrumb navigation for better
    orientation within the galleries workflow.
  - Expected: Gallery editor should show breadcrumbs consistent with the rest of
    the gallery/dashboard navigation.
  - Notes:

## Done

- [x] TODO-0006 `bug` Fix gallery card edit menu navigation
  - Completed: 2026-06-22
  - Context: In My Galleries view variants, clicking the gallery card three-dot
    menu and then Edit navigated to the read-only gallery view instead of the
    editor for that gallery.
  - Outcome: The gallery list edit handler now opens the same full editor route
    used by the read-only gallery view Edit button.
  - Commit: 68a7888

- [x] TODO-0002 `feature` Display tags in gallery view
  - Completed: 2026-06-21
  - Context: Tags were visible on gallery cards but not reliably on the
    read-only gallery detail page.
  - Outcome: Gallery detail fetches by slug now return normalized tag strings,
    matching ID fetches and allowing the existing gallery tag UI to render.
  - Commit: 6ecd5bb

- [x] TODO-0001 `feature` Navigate away from editor after successful gallery save
  - Completed: 2026-06-20
  - Context: After editing a gallery, saving successfully returned to the editor
    still in edit mode.
  - Outcome: Successful create and edit saves now close the save dialog and
    navigate to the read-only gallery view, using slug when available and ID as
    fallback.
  - Commit: 415c5a8

- [x] TODO-0004 `bug` Show delete progress from gallery card menu
  - Completed: 2026-06-16
  - Context: In Galleries view, deleting from the gallery card three-dot menu had
    no visual progress indication before the card disappeared.
  - Outcome: Grid cards and list rows now show a disabled deleting state with a
    spinner and overlay until removal completes.
  - Commit: 2060000
