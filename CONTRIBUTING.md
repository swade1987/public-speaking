# Contributing

Thanks for considering a contribution to this repo.

## Before you start

This is Steve's personal speaker site. Open an issue before working on
anything beyond a typo fix, so the approach can be agreed first.

## Commits and pull requests

- Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/). This is enforced by CI (`commit-lint`).
- Pull request titles must also follow Conventional Commits. CI (`pr-lint`) checks this too, since a squash merge takes its message from the PR title.
- Keep commits small and focused.

Run `pre-commit install --install-hooks` once after cloning to install the
pre-commit hooks (including a local conventional-commit check, so you find
out before you push).

## Testing changes locally

There's no build step. Open `site/index.html` (or any `site/<slug>/index.html`)
directly in a browser to preview it.

To test a real publish, see the "Publishing" section of
[CLAUDE.md](CLAUDE.md).

## Reporting issues

Open an issue on GitHub with what you expected, what happened instead, and
how to reproduce it.
