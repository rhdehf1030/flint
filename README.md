# Flint

> Open-source Postman alternative. AI-friendly API testing for the Git era.

Flint stores all your API collections, scenarios, and environments as plain OpenAPI-compatible YAML files. Version-control them with Git. Run them in CI. Let Claude automate them via MCP.

---

## Why Flint?

| Feature | Postman Free | Flint |
|---|---|---|
| Unlimited collections | ✗ | ✓ |
| Git-based storage | ✗ | ✓ |
| MCP (AI agent) support | ✗ | ✓ |
| Performance benchmarking | Paid | ✓ |
| API mock server | Paid | ✓ |
| OpenAPI import/export | ✓ | ✓ |
| Secret vault | Paid | ✓ |

---

## Installation

```bash
# Install pnpm (if not already)
npm install -g pnpm

# Clone and install
git clone https://github.com/your-org/flint.git
cd flint
pnpm install

# Build all packages
pnpm -r build

# Use the CLI globally
pnpm --filter @flint/cli run link
```

---

## CLI Usage

### `flint run` — Run a scenario

```bash
# Run a scenario file
flint run scenarios/login-flow.yaml

# With a specific environment
flint run scenarios/login-flow.yaml --env staging

# CI output (JSON)
flint run scenarios/login-flow.yaml --reporter json

# GitHub Actions inline annotations
flint run "scenarios/**/*.yaml" --reporter github-actions

# Compare two environments
flint run scenarios/login-flow.yaml --compare base staging
```

### `flint validate` — Validate collection files

```bash
flint validate collections/getUser.yaml
flint validate collections/
```

### `flint import` — Import from OpenAPI / Swagger / Postman

```bash
# Auto-detects format
flint import openapi.json
flint import swagger2.yaml
flint import postman-collection.json
```

### `flint export` — Export to OpenAPI

```bash
flint export --format openapi --output openapi.yaml
```

### `flint watch` — Watch and re-run on change

```bash
flint watch
```

### `flint bench` — Performance benchmark

```bash
flint bench scenarios/get-user.yaml --concurrent 10 --duration 30
flint bench scenarios/get-user.yaml --reporter html --output bench-report.html
```

### `flint mock` — Run a mock server

```bash
flint mock --port 4000 --collection collections/
```

### `flint vault` — Encrypt / decrypt secrets

```bash
flint vault encrypt environments/production.env --vault-key $KEY
flint vault decrypt environments/production.vault --vault-key $KEY
```

### `flint docs` — Generate API documentation

```bash
flint docs --format markdown --output docs/
flint docs --format html --output docs/
```

### `flint hook install` — Git pre-commit hook

```bash
# Auto-run affected scenarios before every commit
flint hook install
flint hook remove
```

---

## File Formats

### Collection (OpenAPI 3.x compatible)

```yaml
# collections/getUser.yaml
openapi: '3.0.0'
info:
  title: Get User
  version: 1.0.0
servers:
  - url: '{{BASE_URL}}'
paths:
  /users/{id}:
    get:
      operationId: getUser
      summary: Get a user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User found
x-flint:
  assertions:
    - status: 200
    - body.id: exists
```

### Scenario

```yaml
# scenarios/user-lifecycle.yaml
x-flint-scenario:
  name: User Lifecycle
  steps:
    - operationId: createUser
      params:
        body: '{"name": "Alice"}'
      extract:
        userId: body.id
    - operationId: getUser
      params:
        path.id: '{{userId}}'
      assertions:
        - status: 200
        - body.name: Alice
    - operationId: deleteUser
      params:
        path.id: '{{userId}}'
      assertions:
        - status: 204
```

### Environment

```bash
# environments/base.env
BASE_URL=https://api.example.com
API_KEY=your-api-key

# environments/staging.env (inherits from base)
BASE_URL=https://staging-api.example.com
```

---

## MCP Integration (Claude AI)

Add Flint as an MCP server in your Claude Code config (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "flint": {
      "type": "sse",
      "url": "http://localhost:3141/sse"
    }
  }
}
```

Start the MCP server:

```bash
# From your Flint workspace
node -e "require('@flint/mcp').startMcpServer(3141, process.cwd())"
```

Or use the Electron app — it starts the MCP server automatically on port 3141.

### Available MCP Tools

| Tool | Description |
|---|---|
| `run_scenario` | Run a scenario file and get results |
| `get_collections` | List all API operations |
| `create_request` | Create a new collection file |
| `get_last_result` | Get the most recent scenario result |
| `analyze_failure` | Get structured failure context for debugging |
| `generate_scenario_from_openapi` | Auto-generate a scenario from an OpenAPI spec |
| `mock_server_start` | Start a mock HTTP server |
| `mock_server_stop` | Stop the mock server |
| `run_bench` | Run a performance benchmark |
| `get_history` | Get response history for an operation |
| `generate_docs` | Generate API documentation |

---

## Electron App

The Electron app provides a full GUI for Flint:

```bash
cd packages/app
pnpm dev          # development mode
pnpm build        # production build
pnpm dist         # package for distribution
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes following the existing code style
4. Run tests: `pnpm -r test`
5. Submit a pull request

See [STACK.md](./STACK.md) for technical details and [WORKFLOW.md](./WORKFLOW.md) for the development process.

---

## License

MIT
