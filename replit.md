# Visão Geral

Esta é uma aplicação de batalha 3D gamificada inspirada em jogos como Hearthstone, League of Legends e Paladins. É um jogo cooperativo de beat 'em up onde os jogadores respondem a perguntas em seus dispositivos móveis para atacar uma Hidra animada em 3D exibida em uma tela de hub central. A aplicação possui funcionalidade multiplayer em tempo real com comunicação WebSocket, gráficos 3D usando Three.js e uma interface de usuário moderna com tema escuro.

# Preferências do Usuário

Estilo de comunicação preferido: Linguagem simples e cotidiana.

# Arquitetura do Sistema

## Arquitetura Frontend
A aplicação usa uma arquitetura de visualização dupla:

- **Aplicativo Móvel**: Interface móvel baseada em React para jogadores individuais entrarem nos jogos, selecionarem personagens e responderem a perguntas.
- **Tela do Hub**: Tela grande que exibe a cena de batalha 3D com a Hidra, avatares dos jogadores, classificações e efeitos de batalha em tempo real.

Ambas as visualizações são servidas pela mesma aplicação React, mas renderizam componentes diferentes com base nos parâmetros da URL (`?view=mobile` ou `?view=hub`).

## Pilha de Tecnologia
- **Frontend**: React 18 com TypeScript, Vite para ferramentas de compilação.
- **Gráficos 3D**: Three.js com React Three Fiber para renderização 3D, animações e efeitos de partículas.
- **Componentes de UI**: Primitivas Radix UI com estilo personalizado usando Tailwind CSS.
- **Gerenciamento de Estado**: Zustand para o estado do jogo, conexões WebSocket e gerenciamento de áudio.
- **Comunicação em Tempo Real**: Socket.IO para conexões WebSocket entre clientes móveis e a tela do hub.
- **Estilo**: Tailwind CSS com configuração de tema escuro personalizado.

## Arquitetura Backend
- **Servidor**: Express.js com TypeScript rodando em Node.js.
- **WebSocket**: Servidor Socket.IO que lida com a sincronização do estado do jogo em tempo real.
- **Armazenamento**: Implementação de armazenamento em memória com interface para futura integração com banco de dados.
- **API**: Endpoints RESTful para verificações de saúde, status do jogo e perguntas.

## Design do Banco de Dados
Atualmente, usa armazenamento em memória com uma interface limpa (`IStorage`) que pode ser facilmente trocada por armazenamento persistente. O esquema inclui:
- **Usuários**: Estrutura básica de autenticação de usuário com nome de usuário/senha.
- O esquema do banco de dados é definido usando Drizzle ORM com dialeto PostgreSQL para implementação futura.

## Gerenciamento de Estado do Jogo
- **Estado Centralizado**: O estado do jogo é gerenciado no servidor e sincronizado entre todos os clientes.
- **Gerenciamento de Jogadores**: Rastreia conexões de jogadores, personagens, pontuações e status em tempo real.
- **Sistema de Batalha**: Rastreamento da vida da Hidra, animações de ataque e cálculo de dano.
- **Sistema de Perguntas**: Entrega dinâmica de perguntas com diferentes tipos de ataque (espada, flecha, magia, fogo).

## Sistema de Gráficos 3D
- **Modelo da Hidra**: Hidra 3D personalizada com múltiplas cabeças, coloração baseada na vida e animações de dano.
- **Avatares dos Jogadores**: Modelos 3D específicos para cada personagem com estilo baseado na classe (guerreiro, mago, arqueiro, paladino).
- **Efeitos de Ataque**: Projéteis animados e sistemas de partículas para diferentes tipos de ataque.
- **Sistemas de Partículas**: Efeitos de partículas dinâmicos para acertos, magia, explosões e atmosfera do ambiente.
- **Sistema de Câmera**: Movimentos de câmera automatizados para destacar a ação da batalha.

## Funcionalidades em Tempo Real
- **Eventos WebSocket**: Entrada de jogadores, respostas, ataques, atualizações do estado do jogo.
- **Sincronização**: Todos os clientes recebem atualizações em tempo real para uma experiência multiplayer perfeita.
- **Animação de Ataque**: Feedback visual imediato quando os jogadores respondem corretamente às perguntas.

# Dependências Externas

## Dependências Principais
- **@neondatabase/serverless**: Conexão com o banco de dados (configurado para PostgreSQL).
- **drizzle-orm**: ORM de banco de dados e gerenciamento de esquema.
- **socket.io**: Comunicação WebSocket em tempo real.

## Gráficos 3D
- **three**: Biblioteca principal de gráficos 3D.
- **@react-three/fiber**: Renderizador React para Three.js.
- **@react-three/drei**: Helpers e abstrações úteis para React Three Fiber.
- **@react-three/postprocessing**: Efeitos de pós-processamento para visuais aprimorados.
- **vite-plugin-glsl**: Suporte a shaders GLSL para efeitos visuais personalizados.

## Framework de UI
- **@radix-ui/react-***: Conjunto completo de primitivas de UI acessíveis.
- **tailwindcss**: Framework CSS utility-first com tema escuro personalizado.
- **class-variance-authority**: Utilitário para gerenciar variantes de componentes.
- **cmdk**: Componente de paleta de comandos.

## Ferramentas de Desenvolvimento
- **vite**: Ferramenta de compilação rápida e servidor de desenvolvimento.
- **typescript**: Segurança de tipos e experiência de desenvolvedor aprimorada.
- **@replit/vite-plugin-runtime-error-modal**: Manipulação de erros em desenvolvimento.

## Suporte de Áudio
A configuração de compilação suporta arquivos de áudio (.mp3, .ogg, .wav) e formatos de modelo 3D (.gltf, .glb) para ativos de jogo aprimorados.