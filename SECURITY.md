# Security Policy

## Supported versions

This repo has no versioned releases; `main` is always what's live at
speaking.stevenwade.xyz. Fixes land on `main` and publish automatically.

## Reporting a vulnerability

Please report security issues privately rather than opening a public GitHub
issue: use [GitHub's private vulnerability reporting](https://github.com/swade1987/public-speaking/security/advisories/new)
for this repository (Security tab → Report a vulnerability).

Include what you'd include in any good bug report: what you found and how
to reproduce it.

## Scope

This is a static site with a small publish script; there's no user input,
authentication, or data storage to attack. Reports about the publish
pipeline (`scripts/publish-r2.js`, the GitHub Actions workflow, or the
R2/Worker hosting it publishes to) are in scope. Reports about content
accuracy aren't a security issue, raise those as a normal issue instead.
