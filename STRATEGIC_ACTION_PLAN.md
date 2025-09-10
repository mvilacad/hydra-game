# Plano de Ação Estratégico: Sincronização Server-Authoritative (v2)

**Para:** Engenheiro de Software Sênior  
**De:** Engenheiro de Software Sênior  
**Assunto:** Refatoração da Lógica de Sincronização de Estado do Jogo para um Modelo Server-Authoritative

> **Informação Crítica:** Todo o ambiente de desenvolvimento e produção do projeto é gerenciado via `docker-compose`. As soluções propostas devem ser totalmente compatíveis com este ecossistema.

## 1. Análise da Causa Raiz (Contextualizada)

A análise do código-fonte confirma que a dessincronização de estado é causada por uma arquitetura de controle do lado do cliente.

-   **Principal Causa (Client-Side):** O hook `client/src/features/battle/hooks/useBattlePhases.ts` implementa uma máquina de estados local em cada cliente. Funções como `startPreparationPhase` utilizam `setTimeout` para orquestrar as fases do jogo (preparação, pergunta, etc.). Isso significa que cada dispositivo executa sua própria lógica de tempo, resultando em uma experiência de usuário inconsistente devido a variações de latência de rede e performance do dispositivo.

-   **Problema Secundário (Server-Side):** O backend não possui um game loop robusto. O arquivo `server/websocket/handlers/gameHandlers.ts`, na função `startNextQuestion`, utiliza uma cadeia de `setTimeout` para avançar as perguntas. Esta abordagem é frágil, não-transacional e suscetível a falhas, não garantindo a consistência do estado em caso de reinicialização ou erro.

O estado global do cliente, gerenciado em `client/src/lib/stores/useGameStore.tsx`, armazena e manipula dados como `questionTimeLeft`, confirmando que a lógica de tempo é, de fato, uma responsabilidade do cliente.

## 2. Proposta de Solução Técnica (Server-Side Authority)

A solução é centralizar 100% da lógica de estado e tempo no servidor. Os clientes se tornarão "espelhos" reativos que apenas renderizam o estado ditado pelo servidor.

1.  **Game Loop Centralizado no Servidor:** Criaremos um novo serviço, `GameLoopService`, no backend. Este serviço gerenciará uma máquina de estados em memória para cada partida ativa, utilizando um `setInterval` robusto para garantir transições de estado consistentes e cronometradas com precisão.

2.  **Comunicação de Estado Autoritativa:** O servidor emitirá um único evento WebSocket, `GAME_STATE_UPDATE`, em cada transição de estado. Este evento será a fonte única da verdade e conterá o estado atual completo, incluindo timestamps UTC de início e fim para qualquer fase cronometrada.

    -   **Exemplo de Payload `GAME_STATE_UPDATE`:**
        ```json
        {
          "phase": "QUESTION",
          "question": { "id": "...", "text": "..." },
          "players": [ ... ],
          "hydraHealth": 850,
          "phaseStartsAt": "2025-09-10T10:00:00.000Z",
          "phaseEndsAt": "2025-09-10T10:00:15.000Z"
        }
        ```

3.  **Renderização Reativa no Cliente:** O cliente usará os timestamps `phaseStartsAt` e `phaseEndsAt` para calcular e exibir a contagem regressiva. A lógica será `tempo_restante = new Date(phaseEndsAt).getTime() - Date.now()`. Isso garante que a UI esteja sempre sincronizada com a autoridade do servidor, independentemente da latência de entrega do evento.

## 3. Plano de Execução (Passo a Passo)

### Fase 1: Backend (Construindo a Fonte da Verdade)

**Passo 1.1: Modelar Estados do Jogo**
-   **Ação:** Em `shared/types.ts`, definir uma união de tipos mais granular para os estados do jogo, substituindo a `GamePhase` existente.
-   **Sugestão:**
    ```typescript
    export type AuthoritativeGamePhase = 
      | 'LOBBY'
      | 'PREPARING' // Contagem regressiva para a pergunta
      | 'QUESTION'  // Pergunta ativa
      | 'REVEAL'    // Mostrando resposta correta/incorreta
      | 'SCOREBOARD'// Exibindo pontuações da rodada
      | 'ENDED';    // Fim de jogo (victory/defeat)
    ```

**Passo 1.2: Criar o `GameLoopService`**
-   **Ação:** Criar um novo arquivo `server/services/GameLoopService.ts`.
-   **Implementação:**
    -   Este serviço exportará um singleton e manterá um `Map` de game loops ativos: `private gameLoops = new Map<number, GameLoop>();`.
    -   Criar uma classe `GameLoop` dentro deste arquivo. Cada instância representará uma partida ativa e conterá:
        -   O estado atual (`phase`, `currentQuestionIndex`, etc.).
        -   A referência do `setInterval` do loop: `private timer: NodeJS.Timeout;`.
        -   Métodos: `start()`, `stop()`, `transitionTo(newPhase)`.
    -   O método `start` iniciará um `setInterval` (e.g., a cada 250ms) que acionará a máquina de estados principal.
    -   A máquina de estados (`runTick()`) verificará se o tempo da fase atual expirou (`Date.now() >= this.phaseEndsAt`) e, em caso afirmativo, fará a transição para a próxima fase, notificando os clientes.

**Passo 1.3: Integrar o `GameLoopService`**
-   **Ação:** Refatorar `GameService.ts` e `gameHandlers.ts`.
    -   Em `GameService.startGame`, em vez de apenas atualizar o status no DB, crie e inicie uma nova instância do `GameLoop` através do `GameLoopService`.
    -   Remova completamente as chamadas `setTimeout` de `server/websocket/handlers/gameHandlers.ts`. O comando de `start_game` agora apenas delega a ação para `gameLoopService.startGame(gameId)`.
    -   O `GameLoop` agora será responsável por invocar métodos do `GameService` (como `nextQuestion`) no momento apropriado.

**Passo 1.4: Implementar o Evento `GAME_STATE_UPDATE`**
-   **Ação:** Modificar a função `broadcastGameState` em `gameHandlers.ts`.
-   **Implementação:** O `GameLoop`, a cada transição de estado, irá gerar o novo payload de estado autoritativo (com `phase`, `question`, `players`, `hydraHealth`, `phaseStartsAt`, `phaseEndsAt`) e chamar `broadcastGameState` para emiti-lo a todos os clientes na sala via o evento `game_state_update`.

### Fase 2: Frontend (Tornando o Cliente Reativo)

**Passo 2.1: Desmantelar a Lógica Antiga**
-   **Ação:** Excluir o arquivo `client/src/features/battle/hooks/useBattlePhases.ts`. Sua funcionalidade será totalmente substituída pela sincronização com o servidor.

**Passo 2.2: Refatorar o `useGameStore`**
-   **Ação:** Modificar `client/src/lib/stores/useGameStore.tsx`.
    -   Remova os estados `questionTimeLeft` e a ação `setQuestionTimeLeft`.
    -   Adicione novos estados para gerenciar a sincronização: `phaseStartsAt: string | null` e `phaseEndsAt: string | null`.
    -   Crie uma nova ação: `handleGameStateUpdate(payload: AuthoritativeState)`. Esta ação irá atualizar `phase`, `currentQuestion`, `players`, `hydraHealth`, `phaseStartsAt`, e `phaseEndsAt` com os dados recebidos do servidor.

**Passo 2.3: Atualizar o Handler de WebSocket**
-   **Ação:** Em `client/src/lib/stores/useWebSocket.tsx` (ou em `websocketEventHandlers.ts`).
-   **Implementação:** Modifique o listener do evento `game_state_update` para que ele chame a nova ação `useGameStore.getState().handleGameStateUpdate(data)`.

**Passo 2.4: Refatorar Componentes de UI (Timer e Gameplay)**
-   **Ação:** Atualizar `client/src/views/mobile/screens/GameplayScreen.tsx` e qualquer componente de timer como `client/src/components/ui/timer.tsx`.
-   **Implementação:**
    -   Esses componentes não receberão mais `timeLeft` como prop. Em vez disso, eles lerão `phaseEndsAt` do `useGameStore`.
    -   Dentro do componente do timer, use um `useEffect` com um `setInterval` local (executando a cada 100ms, por exemplo) para calcular o tempo restante (`new Date(phaseEndsAt).getTime() - Date.now()`) e atualizar um estado local *apenas para exibição*. Este timer não controlará nenhuma lógica de jogo.

**Passo 2.5: Garantir a Lógica de Reconexão**
-   **Ação:** Assegurar que o evento `request_game_state` existente em `server/websocket/index.ts` funcione com o novo modelo.
-   **Implementação:** O cliente já deve chamar este evento ao se reconectar. O handler no servidor (`broadcastGameState`) agora enviará automaticamente o novo payload de estado autoritativo, garantindo que o cliente seja sincronizado para a fase e o tempo corretos instantaneamente.

## 4. Estratégia de Validação e Testes

-   **Testes Unitários (Backend):**
    -   Testar a máquina de estados do `GameLoopService` isoladamente. Fornecer um estado inicial, simular o avanço do tempo e verificar se as transições de fase e os payloads gerados estão corretos.
-   **Testes de Integração (End-to-End):**
    -   **Cenário 1 (Golden Path):** Usar `socket.io-client` em um script de teste para simular múltiplos jogadores. Validar a sequência de eventos `GAME_STATE_UPDATE` e a correção dos timestamps.
    -   **Cenário 2 (Latência):** Introduzir um atraso artificial na recepção de eventos em um cliente de teste. Verificar se a UI da contagem regressiva se ajusta corretamente com base nos timestamps, mesmo chegando atrasada.
    -   **Cenário 3 (Reconexão):** Desconectar um cliente no meio de uma pergunta e reconectá-lo. Verificar se ele recebe o estado `QUESTION` com o tempo restante correto através do evento `request_game_state`.