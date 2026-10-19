# Gallerybook frontend

This is Gallerybook's React, TypeScript, Vite, Tailwind, and shadcn/ui client.
For local setup, environment variables, scripts, and deployment guidance, see
the [repository README](../README.md).

## Vendored comment module

`local_modules/shadcn-comments` is installed through the `file:` dependency in
`package.json`. Its package entry points reference `dist`, and `npm ci` does not
build that local dependency before the GalleryBook frontend is compiled.
Therefore, both its source and generated `dist` directory are intentionally
committed so clean checkouts and CI builds have a usable package.

When changing the vendored module, rebuild it from
`frontend/local_modules/shadcn-comments`, commit the source and resulting
`dist` changes together, and verify the GalleryBook frontend with
`npm run build`. Do not remove the generated files unless the frontend is
changed to compile the module source as part of its own build.
