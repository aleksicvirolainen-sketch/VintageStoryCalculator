# Contributing

Thank you for your interest in contributing to this project!
This document covers how to set up the project, make changes, and open a pull request.

## Ways to Contribute

- **Bug Reports**: Report bugs using the [Bug Report template](https://codeberg.org/D-Heger/VintageStoryCalculator/issues/new?template=bug_report.md)
- **Feature Requests**: Suggest new features using the [Feature Request template](https://codeberg.org/D-Heger/VintageStoryCalculator/issues/new?template=feature_request.md)
- **Code Contributions**: Submit pull requests with bug fixes, improvements, or new features
- **Documentation**: Help improve documentation, the README, or code comments
- **Testing**: Test the application and report issues or suggest improvements

## Development Setup

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Git for version control
- A text editor or IDE (VS Code recommended)

### Getting Started

1. **Fork the repository** on Codeberg

2. **Clone your fork** locally:

   ```bash
   git clone https://codeberg.org/YOUR_USERNAME/VintageStoryCalculator.git
   cd VintageStoryCalculator
   ```

3. **Create a feature branch**: (Or a fix/refactor/etc. branch as appropriate)

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Install dependencies and start the dev server**:

   ```bash
   npm install
   npm run dev
   ```

5. **Make your changes** and test them

6. **Commit your changes**:

   ```bash
   git commit -m "feat(calculators): brief description of your changes"
   ```

   Use [Conventional Commits](https://www.conventionalcommits.org/). The type sets the release version: `feat` makes a minor release, `fix` and `perf` make a patch release, and `!` or a `BREAKING CHANGE:` footer makes a major release. See [RELEASE.md](RELEASE.md).

7. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request** on Codeberg

## Code Guidelines

### General

- Follow the existing code style and patterns
- Run `npm install` once so the Git hooks are set up. On commit they format staged files with Prettier, run ESLint, and check commit messages
- Write meaningful commit messages
- Update documentation as needed
- Ensure changes don't break existing functionality

### AI-Assisted Contributions

AI-assisted contributions are allowed when they are disclosed and remain part of a human-led review process.

- Disclose material AI assistance in the pull request description, including the tool and the work it performed.
- A human must understand, review, and approve the work before it is merged.
- Contributors remain responsible for the correctness, licensing, security, and provenance of their contributions.
- AI agents must not merge, tag, release, or deploy. Merges to `master` create releases through CI, and a maintainer starts each deployment by hand.
- Project-specific contribution rules and maintainer decisions take precedence.

## Testing

### Manual Testing

- Test all calculators with various inputs
- Verify calculations are accurate
- Test on multiple browsers and devices
- Check responsive design on different screen sizes

### Browser Compatibility

Test on:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Pull Request Process

1. Ensure your code follows the guidelines above
2. Update the README.md as needed
3. Write every commit message as a Conventional Commit. Releases read the commits that land on `master` (merge commits are skipped), so the commit messages decide the version
4. Test your changes thoroughly
5. Write a clear PR description explaining:
   - What changes you made
   - Why you made them
   - How to test the changes
6. Link any related issues
7. Wait for review and address any feedback

## Issue Reporting

When reporting bugs or requesting features, please use the appropriate issue templates:

- [Bug Report](https://codeberg.org/D-Heger/VintageStoryCalculator/issues/new?template=bug_report.md)
- [Feature Request](https://codeberg.org/D-Heger/VintageStoryCalculator/issues/new?template=feature_request.md)
- [General Issue](https://codeberg.org/D-Heger/VintageStoryCalculator/issues/new?template=general_issue.md)

## Code of Conduct

Please be respectful and constructive in all interactions. This project follows a code of conduct to ensure a positive environment for all contributors.

## License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.
