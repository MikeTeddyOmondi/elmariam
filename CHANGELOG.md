# Changelog

All notable changes to the El'Mariam rewrite are documented here.

## [c80578e] feat: Task 1 — monorepo scaffold with root config and placeholder packages

- Added pnpm-workspace.yaml covering apps/*, services/*, packages/*, infra/openauth
- Added turbo.json with build/dev/lint/typecheck/db:migrate tasks per spec
- Added root package.json with turbo scripts and pnpm@9.0.0 packageManager
- Added packages/config with tsconfig.base.json and tsconfig.node.json presets
- Added placeholder package.json files for all 6 packages, 6 services, 3 apps, infra/openauth
- Implements: REWRITE_SPEC.md Part 2
