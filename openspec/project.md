# Project Context

## Purpose
OpenSpec is a VS Code extension that provides spec-driven development tooling. It helps developers manage technical specifications, change proposals, and maintain alignment between design documents and implementation. The extension complements the OpenSpec CLI by providing IDE-integrated workflows for creating, validating, and archiving specification changes.

## Tech Stack
- **TypeScript 5.9+** - Primary language with strict type checking
- **VS Code Extension API 1.106+** - Extension framework
- **Node.js 22.x** - Runtime environment
- **Webpack 5** - Module bundler for production builds
- **Mocha** - Testing framework
- **Biome 2.3.5** - Fast linter and formatter
- **ESLint 9** with typescript-eslint - Additional linting

## Project Conventions

### Code Style
- **Formatting**: Tab indentation, double quotes for strings
- **Biome Configuration**: Tab-based formatting with block statements warning and double-equals check
- **ESLint Rules**: 
  - Import naming: camelCase or PascalCase only
  - Curly braces required for control structures
  - Strict equality operators required (`===`/`!==`)
  - No throw literals
  - Semicolons required
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **TypeScript**: Strict mode enabled, ES2022 target, Node16 module resolution

### Architecture Patterns
- **Extension Structure**: Single entry point (`src/extension.ts`) with `activate()` and `deactivate()` lifecycle
- **Command Registration**: Commands defined in `package.json` and registered via `vscode.commands.registerCommand`
- **Module System**: Node16-style imports with tree-shakeable exports
- **Build**: Webpack for production bundling with source maps for debugging
- **Simplicity First**: Default to <100 lines of new code, single-file implementations until proven insufficient

### Testing Strategy
- **Framework**: Mocha with VS Code Test Electron
- **Location**: Tests in `src/test/` directory
- **Compilation**: Separate TSC compilation to `out/` directory for tests
- **Commands**: 
  - `pnpm test` - Run full test suite with pretest compilation and linting
  - `pnpm watch-tests` - Watch mode for test development
- **CI**: Tests run via `@vscode/test-cli`

### Git Workflow
- **Branch**: `master` is the default and main branch
- **Repository**: GitHub repository `Codder13/openspec-vscode-extension`
- **VCS**: Git with `.gitignore` handling via Biome VCS integration
- **Commits**: Should reference OpenSpec change IDs when implementing proposals

## Domain Context
This extension is built to support the OpenSpec methodology:
- **Specs**: Living requirements documents in `openspec/specs/` representing current truth
- **Changes**: Proposals in `openspec/changes/` representing planned modifications
- **Archiving**: Moving completed changes to `openspec/changes/archive/` after deployment
- **Validation**: Ensuring spec format correctness (scenarios, requirements, delta operations)
- **Change IDs**: Kebab-case, verb-led identifiers (e.g., `add-two-factor-auth`)

The extension should integrate with the OpenSpec CLI workflow and provide VS Code-native interfaces for:
- Creating and scaffolding change proposals
- Validating specifications
- Navigating between specs and changes
- Viewing change status and deltas

## Important Constraints
- **VS Code API Version**: Must maintain compatibility with VS Code 1.106+
- **Bundle Size**: Keep extension lightweight; webpack production builds should be optimized
- **Activation**: Currently activates on all events; consider lazy activation for performance
- **Node Version**: Target Node.js 22.x features
- **TypeScript Strict Mode**: All code must compile with strict type checking
- **No Dependencies**: Currently zero runtime dependencies (all devDependencies)

## External Dependencies
- **OpenSpec CLI**: The extension complements the CLI tool (assumed to be installed separately)
- **VS Code Extension Host**: Runs within VS Code's extension host process
- **File System**: Reads/writes to workspace `openspec/` directory structure
- **Git Integration**: May interact with VS Code's built-in Git features for change tracking
