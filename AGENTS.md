
# AGENTS.md

Guidelines for AI agents working in this repository.

## Project Overview

Git alias CLI tool written in TypeScript/Bun. Provides interactive git command shortcuts with table formatting and LLM integration for commit messages.

## Build Commands

```bash
# Install dependencies
bun install

# Build all commands to ./out
bun run build

# Build and link locally for testing
bun run link

# Remove local link
bun run unlink
```

### Testing Commands

When testing individual commands during development, run them directly with Bun:

```bash
# Test a specific command (do NOT use package.json scripts)
bun run src/command/git_add.ts
bun run src/command/git_status.ts
```

**Important**: Do not use `bun run build` scripts during development/testing - they are for production builds only. Use `bun run <file>.ts` to execute TypeScript files directly.

## Lint/Format Commands

```bash
# Run Biome linter
bunx biome lint src/

# Run Biome formatter
bunx biome format --write src/

# Run Biome check (lint + format)
bunx biome check --write src/

# Type check
bunx tsc --noEmit
```

## Code Style Guidelines

### Formatting
- **No semicolons** (enforced by Biome)
- **Single quotes** for strings
- **4-space indentation**
- **ES5 trailing commas** (no trailing commas)
- Max line length: 80

### Imports
- Use ES modules (`"type": "module"`)
- Use `import type` for type-only imports
- Group imports: external deps first, then internal
- Use forward slashes in relative paths: `../utils/common-utils`

```typescript
import { Command } from "commander"
import type { Choice } from "../utils/inquirer-utils"
import { errParse } from "../utils/common-utils"
```

### Naming Conventions
- **camelCase** for functions, variables, parameters
- **PascalCase** for types, interfaces, classes
- Descriptive names: `branchList`, `gitSwitch`, `errParse`
- Boolean prefixes: `isCurrent`, `hasChanges`

### Types
- Enable strict TypeScript mode
- Explicit return types on exported functions
- Use `type` for object shapes, `interface` for extensible contracts
- Prefer `unknown` over `any` for error handling

```typescript
type Branch = {
  name: string
  isCurrent: boolean
}

interface ILLMClient {
  call(request: ILLMRequest): Promise<void>
}
```

### Error Handling
- Use `.catch(errParse)` in command entry points
- Throw descriptive Error objects in business logic
- Handle async errors with try/catch

```typescript
async function gitSwitch({ branch }: GitSwitchArg): Promise<string> {
  return await exec(`git switch ${branch.name}`)
}

// Entry point pattern
new Command()
  .action(async () => { /* ... */ })
  .parseAsync()
  .catch(errParse)
```

### Project Structure
- `src/command/` - CLI entry points (one per git alias)
- `src/action/` - Business logic implementations
- `src/utils/` - Shared utilities
- `src/llm/` - LLM client abstractions
- `src/store/` - Data persistence utilities

### Bun-Specific
- Target Bun runtime (`--target bun`)
- Use `bun:sqlite` for local storage
- Use `Bun.$` or `exec` utility for shell commands

## Environment Variables

Required for LLM features:
- `ALIAS_BASE_URL` / `ALIAS_API_KEY` / `ALIAS_DEFAULT_MODEL` - OpenAI
- `ALIAS_OLLAMA_BASE_URL` / `ALIAS_OLLAMA_DEFAULT_MODEL` - Ollama
- `ALIAS_TYPE='"'"'ollama'"'"'` - Use Ollama instead of OpenAI
- `EDITOR` - Preferred editor (defaults to '"'"'vi'"'"')
