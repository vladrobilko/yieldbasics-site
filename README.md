# YieldBasics

Source for [yieldbasics.com](https://yieldbasics.com): plain-language guides and simple tools for understanding yields in crypto, stocks and beyond.

Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com) on top of the [AstroWind](https://github.com/arthelokyo/astrowind) template (MIT).

## Getting started

Requires Node.js >= 22.22.3.

```sh
npm install      # also enables the pre-push hook in .githooks/
npm run dev      # http://localhost:4321
```

| Command           | Purpose                         |
| ----------------- | ------------------------------- |
| `npm run dev`     | Dev server                      |
| `npm test`        | Unit tests (Vitest)             |
| `npm run check`   | astro check + ESLint + Prettier |
| `npm run build`   | Production build to `./dist/`   |
| `npm run preview` | Preview the production build    |

## Credits

- Coin icons: [Web3 Icons](https://github.com/0xa3k5/web3icons) "token-branded" set (MIT), via [Iconify](https://icon-sets.iconify.design/token-branded/). Coin names and logos are trademarks of their respective owners and are used only to identify the assets.

## Contributing

All changes go through pull requests from branches named `<bugfix|feature>/<author>/<summary>`, e.g. `feature/claude/change-design-for-home-page`. See [AGENTS.md](./AGENTS.md) for the full workflow rules.

> Content on this site is for educational purposes only and is not financial advice.
