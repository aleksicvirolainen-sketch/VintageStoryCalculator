# Vintage Story Calculator

[![License][license-badge]][license]
[![Release][release-badge]][release-link]
[![Netlify Status][netlify-badge]][netlify-link]

A calculator app for Vintage Story players. It handles alloy recipes, casting, charcoal pits, and finding what you can make from the metals you have.

Visit now at: [vintagecalc.eu](https://vintagecalc.eu)

## Roadmap

For a full list of planned features and improvements, see the [Codeberg Project](https://codeberg.org/D-Heger/VintageStoryCalculator/projects/52097).

## Available Tools

### Alloying Calculator

Calculate the amounts of metals needed to create your desired alloy. Supports all alloys and solders in Vintage Story. Switch between "I need ingots" and "I have nuggets" modes. The first mode calculates the required nuggets to produce the desired ingots, while the second mode figures out how many ingots you can produce from the nuggets on hand. Includes smelting temperature information, a process-by-process stack plan view for multi-batch runs, and a share button that copies the current recipe URL.

### Casting Calculator

Calculate the number of ore nuggets needed to cast metal ingots in a crucible. Supports all 8 castable metals, shows smelting temperatures and ore source information, includes a visual stack plan for each smelting process, and supports shareable calculator URLs. It also has an "I have nuggets" mode to see how many ingots your stock produces.

### Usage Finder

Enter the metals you have and discover every alloy and casting option available to you. The tool checks your inventory against all game recipes, shows how many ingots each option yields, and provides a per-metal breakdown of nuggets used versus leftover. Expanding a result reveals the full stack plan and compatible fuels.

### Charcoal Calculator

Calculate pit dimensions, firewood requirements, and charcoal yield for your smelting operations. Supports both "I have a pit" mode (calculate resources needed) and "I need charcoal" mode (find suggested pit size). Includes burn time calculations in both game and real-world minutes, an interactive 3D pit preview, and support for shareable calculator URLs.

## Shareable Recipe URLs

Both calculators support URL-encoded state so you can share exact setups with others.

- Use the `Share recipe` button in the calculator sidebar to copy the current setup URL.
- Opening that URL restores calculator selections automatically.
- URL format is route-aware, for example: `/alloying/?shareRoute=alloying&a=tin_bronze&n=10&Copper=90.0&Tin=10.0`, `/casting/?shareRoute=casting&m=copper&n=10`, and `/usage-finder/?shareRoute=usage&Copper=100&Tin=50`.
- Existing hash-only links such as `#alloying?...` remain supported.
- The "have" mode is encoded as `d=h` with per-metal nugget counts so shared links preserve the calculation direction.
- The sharing system is extensible via per-route codecs registered through `src/lib/url-state.ts`.

### Feedback Form

Send feedback from a dedicated in-app page without creating an account. Submissions are handled by Netlify Forms with spam filtering, minimal required fields, and a privacy acknowledgement.

## How to Use

1. Run `npm install` to install dependencies
2. Start the development server with `npm run dev`
3. Open the provided local URL in your browser
4. Navigate to the desired calculator using the in-app navigation
5. Optionally open settings from the header to customize theme, font family, UI scale, and help-text visibility
6. For alloys: select your alloy type and adjust percentages to see exact nuggets needed
7. For metals: select your metal and target ingots to see nuggets required
8. Use the mode toggle to switch between "I need ingots" and "I have nuggets" in either calculator
9. Use the Usage Finder to add metals from your inventory and see every recipe you can craft

## Development

- `npm run dev`: start a hot-reloading development server (default port 5173)
- `npm run build`: generate an optimized production build
- `npm run preview`: serve the production build locally for verification
- `npm run lint`: run ESLint checks for TypeScript sources
- `npm run format`: format the project with Prettier
- `npm run format:check`: check formatting without changing files

`npm install` also sets up Git hooks. On commit, they format staged files with Prettier, run ESLint, and require Conventional Commit messages.

## Release Process

Merges to `master` create releases automatically from Conventional Commit messages, and deploys are started by hand from the Deploy workflow. See [RELEASE.md](RELEASE.md) for the workflow.

## Contributing

See the [CONTRIBUTING][contributing] file for contribution guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE][license] file for details.

## Links

- [Vintage Story Official Website](https://www.vintagestory.at/)

<!-- Files -->

[contributing]: ./CONTRIBUTING.md
[license]: ./LICENSE

<!-- Badges -->

[release-badge]: https://img.shields.io/gitea/v/release/D-Heger/VintageStoryCalculator?gitea_url=https://codeberg.org
[license-badge]: https://img.shields.io/badge/license-MIT-blue
[netlify-badge]: https://api.netlify.com/api/v1/badges/3da43ce5-7b01-468a-a86c-4b6f90933b76/deploy-status

<!-- Links -->

[release-link]: https://codeberg.org/D-Heger/VintageStoryCalculator/releases
[netlify-link]: https://app.netlify.com/sites/kaleidoscopic-kitsune-48847d/deploys
