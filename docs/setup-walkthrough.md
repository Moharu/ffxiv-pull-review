# Setup walkthrough

This first increment supplies the project foundation. There are no review features yet.

## Follow the render path

1. `index.html` contains the root DOM element and loads `src/main.tsx`.
2. `main.tsx` creates React's root and renders `App` inside `StrictMode`.
3. `App.tsx` exports a function component. Its returned TSX describes the page.
4. `index.css` supplies the page's styles.

TSX is TypeScript with JSX syntax: markup-like expressions that describe React elements. Component names start with an uppercase letter; native HTML elements stay lowercase. A component is a function React calls to work out what to render.

StrictMode enables extra development checks, including extra renders and effect setup/cleanup cycles. Keep rendering free of side effects. We will revisit this when video resource cleanup becomes necessary.

## Why there are no hooks yet

The landing screen has no changing data, so it needs no state. In the next issue, the context form will need to remember what you type across renders: that is where `useState` earns its place. A normal variable inside the component would be recreated on each call, and assigning it would not tell React to render again.

## What the checks mean

- `npm run dev`: Vite serves the app locally with fast development updates.
- `npm run lint`: Oxlint checks configured code rules, including React hooks rules.
- `npm run build`: TypeScript checks the project, then Vite bundles it for production.
- `npm run preview`: serve the built bundle locally after a successful build.

A successful build does not prove that browser interactions work. Behavioural and manual checks will arrive alongside real features.

## Small exercise

Run the app, change the heading in `App.tsx`, and observe the browser update. Trace that heading back through the render path above. Then restore your preferred wording and run lint and build. Next we will replace the static introduction with a labelled recording-context form, one field at a time.
