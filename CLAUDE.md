# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hydra Game is a multiplayer, gamified 3D battle application where players answer questions on mobile devices to attack a 3D animated Hydra displayed on a central hub screen. It uses a single React application serving both mobile (`?view=mobile`) and hub (`?view=hub`) views.

## Development Commands

```bash
# Development
pnpm dev          # Start both client and server in development mode
pnpm build        # Build client (Vite) and server (ESBuild) for production
pnpm start        # Run production server
pnpm check        # TypeScript type checking
pnpm db:push      # Push database schema changes

# Docker Development
docker-compose up        # Start application with Docker (development mode)
docker-compose up -d     # Start in detached mode
docker-compose down      # Stop and remove containers
docker-compose logs -f   # Follow logs

# Docker Production (usando imagens do registry)
docker-compose -f docker-compose.prod.yml up -d     # Usar imagem do registry
./update-hydra-game.sh                               # Script para atualizar aplicação
./debug-server.sh                                    # Script de debug

# Docker Local Build (para desenvolvimento)
docker-compose -f docker-compose.local.yml up --build  # Build local

# CI/CD e Deploy
# - Push para 'main' → GitHub Actions builda e publica imagem
# - Pulumi usa imagem do GitHub Container Registry
# - Deploy automático com `pulumi up`
```

## CI/CD Pipeline

### Workflow Automático
- **Trigger**: Push ou PR para branch `main`
- **GitHub Actions**: Builda imagem Docker e publica no GitHub Container Registry (ghcr.io)
- **Registry**: `ghcr.io/mvilacad/hydra-game:latest`
- **Deploy**: Pulumi usa imagem pré-buildada (não clona repositório)

### Scripts Utilitários
- `./update-hydra-game.sh` - Atualiza aplicação localmente com última imagem
- `./debug-server.sh` - Diagnóstico e troubleshooting
- **Instância EC2**: Script automático `update-app.sh` disponível para atualizações

### Para Colaboradores
1. **Fork/Clone**: Fork o repositório e clone localmente
2. **Desenvolvimento**: Use `pnpm dev` ou `docker-compose up` para desenvolvimento
3. **Testes**: Execute `pnpm check` antes de commits
4. **Deploy**: Pull Requests para `main` triggem build automático
5. **Produção**: Imagem está sempre disponível em `ghcr.io/mvilacad/hydra-game:latest`

### Configuração Pulumi
```bash
cd pulumi/
pulumi config set repoName "seu-usuario/hydra-game"  # Para usar seu fork
pulumi config set keyPairName "sua-key-pair"         # Opcional para SSH
pulumi up                                            # Deploy usando imagem do registry
```

## Architecture

### Dual-View Client-Server Pattern
- **Single React App**: Renders different UIs based on URL parameters
- **Express.js Backend**: API routes + Socket.IO for real-time communication
- **Shared Types**: `/shared/types.ts` defines interfaces used across client/server

### Key Directories
- `/client/src/pages/`: Main app views (MobileApp, HubDisplay, PlayerSetup, Question)
- `/client/src/components/game/`: 3D components (BattleScene, Hydra3D, PlayerAvatar, AttackEffect)
- `/client/src/lib/stores/`: Zustand stores (useWebSocket, useBattle, useGame, useAudio)
- `/server/`: Express server, Socket.IO handlers, API routes, storage abstraction

### Technology Stack
- **Frontend**: React 19 + TypeScript, Three.js + React Three Fiber, Tailwind CSS v4, Zustand, Socket.IO Client
- **Backend**: Express.js + TypeScript, Socket.IO Server, Drizzle ORM (configured for PostgreSQL, currently in-memory)
- **Build**: Vite (client), ESBuild (server), pnpm workspaces

## Game Flow Architecture

1. **Player Join**: QR code scan → mobile view with character selection
2. **Battle Phase**: Real-time question answering with Socket.IO synchronization
3. **Attack System**: Correct answers trigger character-specific 3D animations on hub display
4. **State Management**: Zustand stores handle client state, server maintains authoritative game state

### Real-time Communication
Socket.IO events handle:
- Player join/leave notifications
- Question distribution and answer submission  
- Attack animations and battle state updates
- Score updates and rankings

### 3D Graphics System
Three.js scene with:
- **Hydra3D**: Multi-headed creature with health-based visual changes
- **PlayerAvatar**: Class-specific models (warrior, mage, archer, paladin) 
- **AttackEffect**: Projectile animations matching character types
- **ParticleSystem**: Dynamic effects for attacks and atmosphere

## Important Configuration

### CSS and Styling
- Uses Tailwind CSS v4 with CSS-based configuration (`client/src/theme.css`)
- PostCSS configured with `@tailwindcss/postcss` plugin
- CSS custom properties provide backward compatibility for existing components

### Path Aliases
- `@/` → `client/src/`
- `@shared/` → `shared/`

### Asset Support
- 3D models: `.gltf`, `.glb` files
- Custom GLSL shaders via `vite-plugin-glsl`
- Audio files for character attacks and ambient sounds

## Development Notes

- Server runs on port 5000 (both API and client in development)
- Express 5 requires middleware without wildcard patterns for catch-all routes
- Storage is currently in-memory for rapid development; Drizzle ORM schema prepared for PostgreSQL
- WebSocket handlers in `/server/websocket.ts` manage all real-time game events