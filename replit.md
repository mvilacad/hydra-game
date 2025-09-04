# Overview

This is a gamified 3D battle application inspired by games like Hearthstone, League of Legends, and Paladins. It's a cooperative beat 'em up game where players answer questions on their mobile devices to attack a 3D animated Hydra displayed on a central hub screen. The application features real-time multiplayer functionality with WebSocket communication, 3D graphics using Three.js, and a modern dark-themed UI.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a dual-view architecture:

- **Mobile App**: React-based mobile interface for individual players to join games, select characters, and answer questions
- **Hub Display**: Large screen display showing the 3D battle scene with the Hydra, player avatars, rankings, and real-time battle effects

Both views are served from the same React application but render different components based on URL parameters (`?view=mobile` or `?view=hub`).

## Technology Stack
- **Frontend**: React 18 with TypeScript, Vite for build tooling
- **3D Graphics**: Three.js with React Three Fiber for 3D rendering, animations, and particle effects
- **UI Components**: Radix UI primitives with custom styling using Tailwind CSS
- **State Management**: Zustand stores for game state, WebSocket connections, and audio management
- **Real-time Communication**: Socket.IO for WebSocket connections between mobile clients and hub display
- **Styling**: Tailwind CSS with custom dark theme configuration

## Backend Architecture
- **Server**: Express.js with TypeScript running on Node.js
- **WebSocket**: Socket.IO server handling real-time game state synchronization
- **Storage**: In-memory storage implementation with interface for future database integration
- **API**: RESTful endpoints for health checks, game status, and questions

## Database Design
Currently uses in-memory storage with a clean interface (`IStorage`) that can be easily swapped for persistent storage. The schema includes:
- **Users**: Basic user authentication structure with username/password
- Database schema is defined using Drizzle ORM with PostgreSQL dialect for future implementation

## Game State Management
- **Centralized State**: Game state managed on the server and synchronized across all clients
- **Player Management**: Track player connections, characters, scores, and real-time status
- **Battle System**: Hydra health tracking, attack animations, and damage calculation
- **Question System**: Dynamic question delivery with different attack types (sword, arrow, magic, fire)

## 3D Graphics System
- **Hydra Model**: Custom 3D Hydra with multiple heads, dynamic health-based coloring, and damage animations
- **Player Avatars**: Character-specific 3D models with class-based styling (warrior, mage, archer, paladin)
- **Attack Effects**: Animated projectiles and particle systems for different attack types
- **Particle Systems**: Dynamic particle effects for hits, magic, explosions, and environmental atmosphere
- **Camera System**: Automated camera movements to highlight battle action

## Real-time Features
- **WebSocket Events**: Player joins, answers, attacks, game state updates
- **Synchronization**: All clients receive real-time updates for seamless multiplayer experience
- **Attack Animation**: Immediate visual feedback when players answer questions correctly

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: Database connection (configured for PostgreSQL)
- **drizzle-orm**: Database ORM and schema management
- **socket.io**: Real-time WebSocket communication

## 3D Graphics
- **three**: Core 3D graphics library
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers and abstractions for React Three Fiber
- **@react-three/postprocessing**: Post-processing effects for enhanced visuals
- **vite-plugin-glsl**: GLSL shader support for custom visual effects

## UI Framework
- **@radix-ui/react-***: Complete set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework with custom dark theme
- **class-variance-authority**: Utility for managing component variants
- **cmdk**: Command palette component

## Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Audio Support
The build configuration supports audio files (.mp3, .ogg, .wav) and 3D model formats (.gltf, .glb) for enhanced game assets.