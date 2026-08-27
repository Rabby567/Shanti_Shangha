# Shanti Sangha

A clean React + Vite implementation of the Shanti Sangha website.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Project conventions

- Components are kept small and section-focused.
- Shared content lives in `src/data.ts`.
- Shared TypeScript shapes live in `src/types.ts`.
- Global design tokens and responsive styles live in `src/index.css`.
- The official organization logo is stored at `public/images/logo.svg`.
- The primary brand color is `#197C4F`, matched to the supplied reference.
- Blood-service UI keeps a separate red accent to preserve blood-related visual meaning.
- About-section statistics use viewport-triggered count-up animation.
- Image files in `public/images/` are demo placeholders and can be replaced later.
