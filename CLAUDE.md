# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptHub is a comprehensive AI prompt management platform that consists of three main components:

1. **Web Frontend** (`/web`) - Next.js application for user interface
2. **MCP Server** (`/mcp`) - Model Context Protocol server providing APIs and tools
3. **Database** (`/supabase`) - Supabase configuration and SQL migrations

## Development Commands

### Building the Project
```bash
# Build all components
./build.sh

# Build individual components
cd web && npm run build
cd mcp && npm run build
```

### Development
```bash
# Start development servers
npm run dev                    # Root level (if available)
cd web && npm run dev         # Web frontend (port 9011)
cd mcp && npm run dev         # MCP server (port 9010)

# Start production servers
./start.sh                    # Starts both services
./stop.sh                     # Stops all services
```

### Linting and Type Checking
```bash
cd web && npm run lint        # Lint web frontend
cd web && npm run typecheck   # Type check web frontend
cd mcp && npm run lint        # Lint MCP server
cd mcp && npm run typecheck   # Type check MCP server
```

### Testing
```bash
cd mcp && npm test           # Run MCP server tests
cd mcp && npm run test:detect-leaks  # Run tests with leak detection
```

### Docker
```bash
docker-compose up -d         # Start with Docker
docker-compose down          # Stop Docker containers
```

## Architecture

### Frontend (Next.js - `/web`)
- **Framework**: Next.js 13+ with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context + SWR for data fetching
- **UI Libraries**: Headless UI, Hero Icons, Framer Motion
- **3D Graphics**: Three.js with React Three Fiber
- **Authentication**: Supabase Auth with Next.js middleware

Key directories:
- `src/components/` - React components organized by feature
- `src/pages/` - Next.js pages and API routes
- `src/lib/` - Utility functions and API clients
- `src/contexts/` - React contexts for global state
- `src/hooks/` - Custom React hooks

### Backend (MCP Server - `/mcp`)
- **Framework**: Express.js with TypeScript
- **Protocol**: Model Context Protocol (MCP) for AI tool integration
- **Architecture**: Modular tool-based system
- **Database**: Supabase (PostgreSQL)
- **Logging**: Winston with structured logging
- **Security**: Rate limiting, CORS, security headers

Key directories:
- `src/tools/` - MCP tools organized by functionality
  - `search/` - Search and semantic search tools
  - `storage/` - Storage management tools
  - `optimization/` - Prompt optimization tools
  - `recommendations/` - AI recommendation engine
  - `ui/` - User interface tools
- `src/api/` - Express API routes
- `src/storage/` - Data storage adapters
- `src/monitoring/` - System monitoring and logging

### Database (`/supabase`)
- **Platform**: Supabase (PostgreSQL)
- **Migrations**: Located in `migrations/` directory
- **Schema**: Defined in `schema.sql`
- **Extensions**: Custom auth, search, and social features

## Environment Configuration

The project uses a unified `.env` file at the root level. Key variables:

```bash
# Database
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=your-openai-api-key

# Service Ports
WEB_PORT=9011
MCP_PORT=9010

# Security
JWT_SECRET=your-jwt-secret
SECURITY_LEVEL=balanced  # loose/balanced/strict
```

## MCP Tools System

The MCP server implements a sophisticated tool system:

### Tool Categories
- **Search Tools**: Unified search, semantic search, caching
- **Storage Tools**: Auto-storage, unified store management
- **Optimization Tools**: Prompt optimization, MCP optimization
- **Recommendation Tools**: Smart recommendations based on usage
- **Config Tools**: Configuration assistance
- **UI Tools**: Conversational UI, quick copy functionality

### Tool Development
All tools inherit from `src/shared/base-tool.ts` and follow these patterns:
- Use dependency injection via `src/shared/di-container.ts`
- Implement error handling via `src/shared/error-handler.ts`
- Follow response formatting in `src/shared/response-formatter.ts`

## TypeScript Configuration

### Web Frontend (`web/tsconfig.json`)
- Target: ES2015
- Strict mode enabled
- Path aliases: `@/*` maps to `./src/*`
- Next.js optimized settings

### MCP Server (`mcp/tsconfig.json`)
- Target: ES2022
- Module: NodeNext (ESM)
- Source maps and declarations enabled
- Strict mode disabled for flexibility

## Security Considerations

The project implements multi-level security:
- Configurable security levels (loose/balanced/strict)
- Rate limiting and CORS protection
- JWT-based authentication
- Row Level Security (RLS) in Supabase
- Input validation and sanitization

## Testing Strategy

- Unit tests for MCP tools and utilities
- Integration tests for API endpoints
- Memory leak detection in test suite
- Use Jest with ES modules support

## Deployment

### Development
Use `./start.sh` for local development - it handles all service startup and health checks.

### Production
- Docker Compose configuration provided
- Health checks for both services
- Resource limits configured
- Persistent volume mounting for data and logs

## Common Workflows

1. **Adding New MCP Tools**: Create in appropriate `src/tools/` subdirectory, extend base tool class
2. **Frontend Components**: Use existing component patterns in `src/components/`
3. **API Endpoints**: Add to `src/pages/api/` for Next.js or `src/api/` for MCP server
4. **Database Changes**: Create migrations in `supabase/migrations/`

## File Organization Principles

- Components organized by feature, not type
- Shared utilities in dedicated directories
- Clear separation between frontend and backend concerns
- Modular MCP tools with clear interfaces
- Comprehensive documentation in `docs/` directory