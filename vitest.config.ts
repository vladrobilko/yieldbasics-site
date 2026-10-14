/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Uses the project's Astro config, so the `~` alias and the `astrowind:config`
// virtual module (built from src/config.yaml) resolve in tests too.
export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts', 'vendor/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
