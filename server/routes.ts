import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupWebSocket } from "./websocket";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Game state endpoints
  app.get("/api/game/status", (req, res) => {
    res.json({
      status: "waiting",
      players: [],
      hydraHealth: 1000,
      maxHydraHealth: 1000
    });
  });

  // Sample questions endpoint
  app.get("/api/questions", (req, res) => {
    const sampleQuestions = [
      {
        id: "q1",
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correct: "Paris",
        type: "sword"
      },
      {
        id: "q2",
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correct: "Mars",
        type: "arrow"
      },
      {
        id: "q3",
        question: "What is 15 + 27?",
        options: ["40", "42", "45", "47"],
        correct: "42",
        type: "magic"
      },
      {
        id: "q4",
        question: "Who painted the Mona Lisa?",
        options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
        correct: "Da Vinci",
        type: "fire"
      },
      {
        id: "q5",
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic", "Indian", "Arctic", "Pacific"],
        correct: "Pacific",
        type: "sword"
      }
    ];
    
    res.json(sampleQuestions);
  });

  // Player management endpoints
  app.post("/api/players", (req, res) => {
    const { name, character } = req.body;
    
    if (!name || !character) {
      return res.status(400).json({ error: "Name and character are required" });
    }
    
    const player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      character,
      score: 0,
      isConnected: true,
      joinedAt: new Date().toISOString()
    };
    
    res.json(player);
  });

  // Battle simulation endpoints (for testing)
  app.post("/api/battle/attack", (req, res) => {
    const { playerId, attackType, damage } = req.body;
    
    if (!playerId || !attackType) {
      return res.status(400).json({ error: "Player ID and attack type are required" });
    }
    
    const attack = {
      id: `attack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      type: attackType,
      damage: damage || 100,
      timestamp: Date.now()
    };
    
    res.json(attack);
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  setupWebSocket(httpServer);

  return httpServer;
}
