# AGENTS.md - Coding Guidelines for git-alias

## Project Overview
A TypeScript/Bun CLI tool providing simplified git command aliases with interactive prompts and LLM integration.

## Build Commands

```bash
# Install dependencies
bun install

# Build the project (compiles TypeScript to out/ directory)
bun run build

# Build and link locally for testing
bun run link

# Unlink from local
bun run unlink
```

## Lint/Format Commands

```bash
# Run ESLint
npx eslint src/

# Run ESLint with fix
npx eslint src/ --fix

# Run Prettier (config in .prettier.json)
npx prettier --write "src/**/*.ts"
```

**Note**: No test framework is configured in this project.

## Code Style Guidelines

### Formatting
- **No semicolons** (enforced by ESLint and Prettier)
- **Single quotes** for strings
- **4-space indentation** (tabs)
- **ES5 trailing commas**
- Target: ESNext with Bun runtime
- Module system: ES Modules

### Imports
- Use `import type` for type-only imports
- Group imports: external packages first, then internal modules
- Example:
  ```typescript
  import { Command } from "commander"
  import type { Choice } from "../utils/inquirer-utils"
  import { color } from "../utils/color-utils"
  ```

### Naming Conventions
- **Files**: kebab-case for utilities (e.g., `color-utils.ts`), descriptive for commands (e.g., `git_status.ts`)
- **Types/Interfaces**: PascalCase (e.g., `ILLMClient`, `Branch`, `LLMMessage`)
- **Functions/Variables**: camelCase (e.g., `branchList`, `printTable`)
- **Constants**: camelCase or UPPER_CASE for true constants
- **Type aliases**: PascalCase with descriptive names

### TypeScript
- Enable strict mode (already configured in tsconfig.json)
- Define explicit return types for exported functions
- Use interfaces for object shapes that will be implemented
- Use type aliases for unions, tuples, and mapped types
- Prefer `readonly` arrays where mutation isn't needed

### Error Handling
- Use async/await with try/catch
- Use the custom `errParse` utility for error formatting in commands
- Example:
  ```typescript
  .parseAsync()
  .catch(errParse)
  ```
- Throw descriptive Error instances with clear messages

### Architecture Patterns
- **Commands**: Located in `src/command/`, each command is a standalone executable
- **Actions**: Business logic in `src/action/`
- **Utils**: Shared utilities in `src/utils/`
- **Store**: SQLite database interactions in `src/store/`
- **LLM**: OpenAI and Ollama client implementations in `src/llm/`

### Function Style
- Prefer arrow functions for callbacks and simple operations
- Use regular functions for exported utilities
- Use object method shorthand in classes
- Destructure parameters when accessing multiple properties

### Comments
- Use `// ---- section name ---- //` for section dividers
- Keep comments minimal and descriptive
- Document complex business logic, not obvious code

### Environment Variables
The project uses these environment variables:
- `EDITOR` - Preferred text editor
- `ALIAS_BASE_URL`, `ALIAS_API_KEY`, `ALIAS_DEFAULT_MODEL` - OpenAI config
- `ALIAS_OLLAMA_BASE_URL`, `ALIAS_OLLAMA_DEFAULT_MODEL` - Ollama config
- `ALIAS_TYPE` - Set to 'ollama' to use Ollama instead of OpenAI

## Project Structure
```
src/
  command/      # CLI command entry points
  action/       # Business logic implementations
  utils/        # Shared utility functions
  store/        # Database/store implementations
  llm/          # LLM client implementations
```
