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

- [ ] TODO-0027 `bug` Make shared gallery links accessible anonymously
  - Context: Public folder cards link to gallery routes whose frontend and
    backend handlers require authentication.
  - Expected: Add an anonymous read-only gallery path while keeping drafts and
    private galleries unavailable.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0028 `bug` Handle empty and malformed gallery content safely
  - Context: Gallery content is optional, but content traversal expects a
    ProseMirror object and can fail on null or malformed values.
  - Expected: Initialize a valid document, validate writes, and safely read
    legacy empty content.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0029 `security` Revoke access tokens after password changes
  - Context: Password changes update revocation metadata, but access-token
    validation does not check it.
  - Expected: Reject access tokens issued before the latest password change and
    preserve the replacement-token flow.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0030 `bug` Synchronize auth-dependent stores on login and logout
  - Context: Login does not load follow state and logout does not reset it.
  - Expected: Centralize auth transitions so user and follow state cannot be
    stale or leak between accounts.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0031 `bug` Align profile-edit validation with signup
  - Context: Profile edits accept empty or unbounded names and usernames and do
    not map uniqueness conflicts clearly.
  - Expected: Share normalization and length rules and return useful conflict
    errors for duplicate account fields.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0032 `chore` Add continuous integration workflows
  - Context: The repository has no project-level CI workflow.
  - Expected: Run backend and frontend lint, tests, builds, and backend e2e
    coverage for pull requests.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0033 `chore` Make test database resets deterministic
  - Context: Test startup uses a fixed sleep and does not remove the named
    PostgreSQL test volume.
  - Expected: Wait for database readiness, reset state reliably, and keep
    destructive cleanup out of production services.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0034 `chore` Align development and production PostgreSQL versions
  - Context: Development and test use PostgreSQL 13 while production uses 16.
  - Expected: Use one supported major version across environments and verify
    existing migrations against it.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0035 `feature` Add application health checks and deploy verification
  - Context: Only PostgreSQL has a container health check and deployments do
    not wait for application readiness.
  - Expected: Add backend and frontend health checks and make deployment fail
    clearly when updated services do not become healthy.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0036 `performance` Use the optimized login hero asset
  - Context: Login loads a multi-megabyte PNG despite an equivalent, much
    smaller WebP already being present.
  - Expected: Serve the optimized asset and remove unused starter and duplicate
    frontend assets.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0037 `feature` Paginate public folders and gallery comments
  - Context: Public folders and gallery comment threads can return unbounded
    collections.
  - Expected: Add bounded pagination or incremental loading without breaking
    deterministic ordering.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0038 `security` Harden avatar upload lifecycle
  - Context: Avatar validation trusts the MIME header and replaced Cloudinary
    assets are not deleted.
  - Expected: Validate image content, retain the provider asset ID, and clean up
    replaced uploads.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0039 `chore` Migrate Prisma seed configuration
  - Context: Prisma reports that `package.json#prisma` configuration is
    deprecated.
  - Expected: Move seed configuration to `prisma.config.ts` before the next
    major Prisma upgrade.
  - Notes: From the 2026-07-28 codebase review.

- [ ] TODO-0040 `chore` Consolidate stale project notes and test placeholders
  - Context: A legacy frontend TODO file, starter artifacts, dead commented
    routes, and an e2e placeholder remain in the repository.
  - Expected: Preserve useful historical notes in appropriate documentation and
    remove obsolete source and test placeholders.
  - Notes: From the 2026-07-28 codebase review.

## Done

- [x] TODO-0026 `bug` Enforce gallery visibility on comments and reactions
  - Completed: 2026-07-29
  - Context: Comment and reaction endpoints did not apply gallery visibility
    rules consistently and comment payloads still accepted a client user ID.
  - Outcome: Gallery detail, comment reads and writes, and reaction endpoints
    now share one visibility predicate; inaccessible resources and
    cross-gallery reply parents return not found; comment ownership comes from
    authentication; and comment creation is transactional.

- [x] TODO-0025 `bug` Make gallery deletion atomic and comment-safe
  - Completed: 2026-07-28
  - Context: Gallery media was deleted before the database row, while comments
    prevented gallery deletion through a restrictive foreign key.
  - Outcome: Gallery deletion now cascades comment threads in PostgreSQL before
    cleaning up storage, limits media deletion to the gallery's own upload
    prefix including its thumbnail, and logs post-delete storage failures
    without reporting a failed database deletion.

- [x] TODO-0024 `chore` Decide whether vendored shadcn-comments dist should stay
  - Completed: 2026-07-27
  - Context: The repo included local module source and generated dist files for
    `shadcn-comments` without explaining whether both were intentional.
  - Outcome: The generated package remains vendored because the local
    dependency's entry points require it and clean installs do not build it.
    The frontend documentation and module ignore rules now record that policy
    and require source and dist updates to be committed together.

- [x] TODO-0023 `bug` Make backend e2e test script CI-friendly
  - Completed: 2026-07-26
  - Context: Backend `test:e2e` used Jest watch mode and depended on an
    undeclared environment-loading CLI.
  - Outcome: E2E tests now run once and serially by default, watch mode has an
    explicit command, Node loads the test environment without an undeclared
    dependency, and the suite matches current auth and gallery API contracts.

- [x] TODO-0022 `chore` Make backend lint non-mutating
  - Completed: 2026-07-25
  - Context: Backend `npm run lint` ran ESLint with `--fix`, allowing routine
    checks and CI runs to modify source files.
  - Outcome: Backend linting now defaults to a check-only command, explicit
    fixes live under `npm run lint:fix`, and the existing lint findings were
    resolved so the non-mutating command passes cleanly.

- [x] TODO-0021 `chore` Split large frontend bundles
  - Completed: 2026-07-24
  - Context: Production builds eagerly preloaded large TipTap and MDX editor
    chunks on every page.
  - Outcome: Gallery detail and create/edit routes now load on demand with a
    stable loading state, editor styles are route-scoped, and the build rejects
    regressions that add editor assets back to the initial HTML. Initial raw
    JavaScript delivery dropped from roughly 3.55 MB to 883 KB.

- [x] TODO-0020 `feature` Add pending-activation UX after signup and OAuth
  - Completed: 2026-07-23
  - Context: New email/password and OAuth users were created inactive, but auth
    flows still issued tokens and relied on protected-route failures.
  - Outcome: Signup, password sign-in, and OAuth now return or redirect inactive
    accounts to a dedicated approval-pending screen without issuing access or
    refresh tokens, while active sign-in behavior remains unchanged.

- [x] TODO-0019 `chore` Add production env validation for integrations
  - Completed: 2026-07-22
  - Context: Backend env validation covered core auth/database settings but not
    required production media, OAuth, and Turnstile settings.
  - Outcome: Production startup now validates S3, CloudFront, Cloudinary,
    Google/GitHub OAuth, and Turnstile configuration, including blank values and
    optional integration URL formats, while development and test remain
    permissive.

- [x] TODO-0018 `feature` Add deterministic comment ordering
  - Completed: 2026-07-21
  - Context: Comment queries did not specify ordering for top-level comments or
    replies.
  - Outcome: Gallery comment threads now load chronologically at every nested
    reply depth with stable ID tie-breakers, optimistic replies preserve that
    order, and newest-first moderation results have deterministic pagination.

- [x] TODO-0017 `bug` Make nested comment loading consistent
  - Completed: 2026-07-20
  - Context: Comment loading included users for first-level replies, but deeper
    replies were shaped differently.
  - Outcome: Comment thread loading now uses a bounded recursive reply include
    so loaded nested replies include users, action counts, and selected
    reactions consistently.

- [x] TODO-0016 `bug` Keep reaction counters consistent under concurrency
  - Completed: 2026-07-19
  - Context: Gallery and comment reaction toggles maintained denormalized
    counters with increment/decrement updates.
  - Outcome: Reaction toggles now use idempotent create/delete operations and
    reconcile denormalized counters from persisted reaction rows after each
    toggle, with focused gallery and comment service coverage.

- [x] TODO-0015 `bug` Initialize gallery detail reaction state from API
  - Completed: 2026-07-18
  - Context: Gallery detail initialized like/favorite state to false and did
    not load the current user's existing reactions.
  - Outcome: Gallery detail responses now include the current user's reaction
    state, and the detail page initializes the like/favorite buttons from it.

- [x] TODO-0014 `feature` Finish followed feed filtering
  - Completed: 2026-07-17
  - Context: Gallery list filtering ignored owner, favorite, and liked filters
    when `followedOnly` was enabled.
  - Outcome: Followed feed filtering now composes as an intersection with owner,
    favorite, liked, URL query state, and hook API parameters, with backend and
    frontend coverage.

- [x] TODO-0013 `feature` Add public and shareable folder pages
  - Completed: 2026-07-16
  - Context: Folder APIs were owner-scoped, while galleries exposed folder
    metadata.
  - Outcome: Added an unguarded `/public/folders/:username/:slug` API that
    returns folder metadata plus published public/unlisted galleries, and added
    a shareable frontend route at `/folders/:username/:folderSlug`.

- [x] TODO-0012 `bug` Add a max page size to gallery pagination
  - Completed: 2026-07-10
  - Context: Gallery list pagination clamped page size to at least 1 but had no
    upper bound.
  - Outcome: Gallery list pagination now caps page size at 100 and uses the
    same clamped metadata for normal list queries and early empty
    favorite/liked responses.

- [x] TODO-0011 `chore` Simplify async recursion in image rewriting
  - Completed: 2026-07-09
  - Context: Gallery image rewriting had un-awaited recursive calls before the
    awaited traversal path.
  - Outcome: Replaced the duplicate traversal with a single awaited recursive
    path that handles both node and array content, with focused coverage for
    nested image nodes and direct array content.

- [x] TODO-0010 `bug` Make gallery image URL rewriting idempotent
  - Completed: 2026-07-08
  - Context: Gallery image rewriting treated image `src` values as raw S3 keys,
    which could double-rewrite already signed, CDN, or externally hosted image
    URLs.
  - Outcome: Image rewriting now only rewrites raw stored keys and preserves
    absolute, CDN, signed, protocol-relative, data, blob, query, and fragment
    sources with their existing metadata.

- [x] TODO-0009 `bug` Harden presigned S3 upload path validation
  - Completed: 2026-07-07
  - Context: Presigned URL generation validated image type from extension, but
    not that requested keys stayed under the expected user/gallery upload
    prefix.
  - Outcome: Presign requests now resolve the gallery owner after manage-access
    verification and reject upload keys outside
    `uploads/users/:userId/galleries/:galleryId/`, plus absolute, URL-like,
    backslash, traversal, and unsupported image paths.

- [x] TODO-0008 `bug` Redirect users after unrecoverable 401s
  - Completed: 2026-07-06
  - Context: `frontend/src/lib/apiClient.ts` cleared the access token and showed
    a toast on 401 responses, but it did not route the user back to login after
    refresh failed.
  - Outcome: Unrecoverable 401 handling now clears the access token, emits an
    app-level unauthorized-session event, clears in-memory user/follow state,
    and navigates to `/login` through the React router.

- [x] TODO-0003 `chore` Replace stale broad folder backlog item
  - Completed: 2026-07-06
  - Context: Folders are already modeled in Prisma and have backend/frontend
    implementations, so the old "consider implementing folders" item was too
    broad.
  - Outcome: Replaced the stale folder backlog entry with specific folder and
    maintenance follow-ups.

- [x] TODO-0007 `feature` Make gallery view counter functional
  - Completed: 2026-06-23
  - Context: Gallery cards and detail pages display view counts, but the counter
    was not yet confirmed to increment and persist reliably.
  - Outcome: Read-only gallery fetches now increment the persisted view count
    without touching the gallery update timestamp, and the detail masthead
    displays the stored count alongside gallery cards.
  - Commit: e92c7d9, f48f4e2

- [x] TODO-0005 `feature` Add breadcrumbs to gallery editor page
  - Completed: 2026-06-23
  - Context: The gallery editor page needed breadcrumb navigation for better
    orientation within the galleries workflow.
  - Outcome: The gallery editor now shows the shared gallery breadcrumb above
    the editor toolbar, with the current create/edit page label supplied by the
    editor.
  - Commit: ec82ab2

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
