# Release process

Releases are created automatically when commits land on `master`. Deploying a release to production is a separate, manual step.

## 1. Automatic release on merge

The `Release` workflow (`.forgejo/workflows/release.yml`) runs on every push to `master`:

1. `build` lints and builds the merged commit. If it fails, no release is created.
2. `release` finds the latest stable release tag (`X.Y.Z`), reads the commits since that tag, and works out the next version with `scripts/release.mjs`.
3. If any commit calls for a release, it creates the Forgejo release `Release X.Y.Z` on the merged commit. Forgejo creates the tag `X.Y.Z` there.

Merges that contain only other changes, such as `docs`, `refactor`, or `chore`, create no release.

### Commit messages set the version

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). The largest bump among the commits wins:

| Commit                                                      | Version bump | Example                                  |
| ----------------------------------------------------------- | ------------ | ---------------------------------------- |
| `!` after the type or scope, or a `BREAKING CHANGE:` footer | major        | `feat!: drop the old share format`       |
| `feat`                                                      | minor        | `feat(calculators): add charcoal export` |
| `fix`, `perf`, `revert`                                     | patch        | `fix(usage): keep leftover nuggets`      |
| Any other type, or no type                                  | none         | `docs: update the README`                |

- The next version is computed from the latest stable tag. Pre-release tags such as `0.8.0-beta.1` do not change that base, but their commits are included in the next changelog.
- Merge commits are ignored. The commits behind a merged branch are read directly.
- If you squash a branch, write the squashed commit message as a Conventional Commit. That is the commit the planner reads.

### What a release contains

- The tag `X.Y.Z`, with no `v` prefix, on the merged commit.
- A published Forgejo release named `Release X.Y.Z`. It is neither a draft nor a pre-release.
- Release notes generated from the commit messages since the previous release. Entries are grouped into Breaking changes, Features, Fixes, Performance, and Other changes, and each links to its commit.

## 2. Deploy a release

Deploys are started by hand:

1. In Forgejo, open **Actions**, choose **Deploy**, and run it on `master`.
2. Leave `version` empty to deploy the latest stable release, or enter a version such as `0.8.0` to deploy that release.

The Deploy workflow (`.forgejo/workflows/deploy.yml`):

- refuses to run from any branch other than `master`;
- refuses a version that has no release, or whose release is still a draft;
- refuses a release whose tag does not point at a commit on `master`;
- checks out the release's commit, installs the pinned dependencies, lints, and builds;
- deploys `dist/` to Netlify with `--prod --no-build`;
- smoke-tests `https://vintagecalc.eu`: routes, static assets, and cache headers.

If the deploy or the smoke test fails, fix the cause and run Deploy again. The release itself is not changed.

## 3. Troubleshooting

- **The build failed on `master`:** no release was created. Fix the problem with a new commit to `master`. The next push releases if its commits call for it.
- **The release request failed:** nothing was released. Re-run the Release workflow. It plans the same version again.
- **A release has the wrong notes:** edit the release in Forgejo. To publish the same version again, delete the release and its tag first. Otherwise the planner treats that version as already released.
- **A merge released nothing:** open the Release workflow log. The planner prints the base version and either the version it chose or "No releasable commits".

## Secrets

- `CODEBERG_RELEASE_TOKEN`: reads releases and creates releases and tags.
- `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`: deploy to Netlify.
