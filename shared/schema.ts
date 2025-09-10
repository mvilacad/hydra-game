import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	json,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

// Enums
export const gameStatusEnum = pgEnum("game_status", [
	"waiting",
	"battle",
	"victory",
	"defeat",
	"finished",
]);

export const characterEnum = pgEnum("character", [
	"warrior",
	"mage",
	"archer",
	"paladin",
]);

export const attackTypeEnum = pgEnum("attack_type", [
	"sword",
	"arrow",
	"magic",
	"fire",
	"miss",
]);

export const eventTypeEnum = pgEnum("event_type", [
	"game_created",
	"player_joined",
	"player_left",
	"question_started",
	"question_ended",
	"answer_submitted",
	"attack_performed",
	"game_finished",
	"game_reset",
]);

// Tables
export const games = pgTable("games", {
	id: serial("id").primaryKey(),
	code: varchar("code", { length: 6 }).notNull().unique(),
	status: gameStatusEnum("status").notNull().default("waiting"),
	hydraHealth: integer("hydra_health").notNull().default(1000),
	maxHydraHealth: integer("max_hydra_health").notNull().default(1000),
	currentQuestionIndex: integer("current_question_index").default(0),
	questionsData: json("questions_data"), // JSON array of questions
	configuration: json("configuration"), // Game settings (timeouts, etc)
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
	finishedAt: timestamp("finished_at"),
});

export const gameQuestions = pgTable("game_questions", {
	id: serial("id").primaryKey(),
	gameId: integer("game_id")
		.references(() => games.id, { onDelete: "cascade" })
		.notNull(),
	questionData: json("question_data").notNull(), // Full question object
	position: integer("position").notNull(), // Order in the game
	timeLimit: integer("time_limit").notNull().default(30), // Seconds
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
	id: serial("id").primaryKey(),
	gameId: integer("game_id")
		.references(() => games.id, { onDelete: "cascade" })
		.notNull(),
	name: varchar("name", { length: 50 }).notNull(),
	character: characterEnum("character").notNull(),
	score: integer("score").notNull().default(0),
	isConnected: boolean("is_connected").notNull().default(false),
	socketId: text("socket_id"),
	playerId: varchar("player_id", { length: 50 }).notNull(), // UUID-like identifier
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
});

export const playerAnswers = pgTable("player_answers", {
	id: serial("id").primaryKey(),
	playerId: integer("player_id")
		.references(() => players.id, { onDelete: "cascade" })
		.notNull(),
	gameId: integer("game_id")
		.references(() => games.id, { onDelete: "cascade" })
		.notNull(),
	questionId: integer("question_id")
		.references(() => gameQuestions.id, { onDelete: "cascade" })
		.notNull(),
	answer: text("answer").notNull(),
	isCorrect: boolean("is_correct").notNull(),
	timeSpent: integer("time_spent").notNull(), // Milliseconds
	points: integer("points").notNull().default(0),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attacks = pgTable("attacks", {
	id: serial("id").primaryKey(),
	playerId: integer("player_id")
		.references(() => players.id, { onDelete: "cascade" })
		.notNull(),
	gameId: integer("game_id")
		.references(() => games.id, { onDelete: "cascade" })
		.notNull(),
	attackType: attackTypeEnum("attack_type").notNull(),
	damage: integer("damage").notNull(),
	isSuccessful: boolean("is_successful").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameEvents = pgTable("game_events", {
	id: serial("id").primaryKey(),
	gameId: integer("game_id")
		.references(() => games.id, { onDelete: "cascade" })
		.notNull(),
	playerId: integer("player_id").references(() => players.id, {
		onDelete: "set null",
	}),
	eventType: eventTypeEnum("event_type").notNull(),
	eventData: json("event_data"), // Additional event context
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameStats = pgTable("game_stats", {
	id: serial("id").primaryKey(),
	gameId: integer("game_id")
		.references(() => games.id, { onDelete: "cascade" })
		.notNull(),
	totalPlayers: integer("total_players").notNull(),
	questionsCount: integer("questions_count").notNull(),
	duration: integer("duration"), // Seconds from start to finish
	winnerId: integer("winner_id").references(() => players.id),
	teamWon: boolean("team_won").notNull(),
	finalHydraHealth: integer("final_hydra_health").notNull(),
	averageScore: integer("average_score"),
	highestScore: integer("highest_score"),
	totalAnswers: integer("total_answers"),
	correctAnswers: integer("correct_answers"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const gamesRelations = relations(games, ({ many }) => ({
	players: many(players),
	questions: many(gameQuestions),
	answers: many(playerAnswers),
	attacks: many(attacks),
	events: many(gameEvents),
	stats: many(gameStats),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
	game: one(games, {
		fields: [players.gameId],
		references: [games.id],
	}),
	answers: many(playerAnswers),
	attacks: many(attacks),
}));

export const gameQuestionsRelations = relations(
	gameQuestions,
	({ one, many }) => ({
		game: one(games, {
			fields: [gameQuestions.gameId],
			references: [games.id],
		}),
		answers: many(playerAnswers),
	}),
);

export const playerAnswersRelations = relations(playerAnswers, ({ one }) => ({
	player: one(players, {
		fields: [playerAnswers.playerId],
		references: [players.id],
	}),
	game: one(games, {
		fields: [playerAnswers.gameId],
		references: [games.id],
	}),
	question: one(gameQuestions, {
		fields: [playerAnswers.questionId],
		references: [gameQuestions.id],
	}),
}));

export const attacksRelations = relations(attacks, ({ one }) => ({
	player: one(players, {
		fields: [attacks.playerId],
		references: [players.id],
	}),
	game: one(games, {
		fields: [attacks.gameId],
		references: [games.id],
	}),
}));

export const gameEventsRelations = relations(gameEvents, ({ one }) => ({
	game: one(games, {
		fields: [gameEvents.gameId],
		references: [games.id],
	}),
	player: one(players, {
		fields: [gameEvents.playerId],
		references: [players.id],
	}),
}));

export const gameStatsRelations = relations(gameStats, ({ one }) => ({
	game: one(games, {
		fields: [gameStats.gameId],
		references: [games.id],
	}),
	winner: one(players, {
		fields: [gameStats.winnerId],
		references: [players.id],
	}),
}));

// Zod schemas
export const insertGameSchema = createInsertSchema(games);
export const selectGameSchema = createSelectSchema(games);
export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export const insertGameQuestionSchema = createInsertSchema(gameQuestions);
export const insertPlayerAnswerSchema = createInsertSchema(playerAnswers);
export const insertAttackSchema = createInsertSchema(attacks);
export const insertGameEventSchema = createInsertSchema(gameEvents);
export const insertGameStatsSchema = createInsertSchema(gameStats);

// Export types
export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;
export type GameQuestion = typeof gameQuestions.$inferSelect;
export type InsertGameQuestion = typeof gameQuestions.$inferInsert;
export type PlayerAnswer = typeof playerAnswers.$inferSelect;
export type InsertPlayerAnswer = typeof playerAnswers.$inferInsert;
export type Attack = typeof attacks.$inferSelect;
export type InsertAttack = typeof attacks.$inferInsert;
export type GameEvent = typeof gameEvents.$inferSelect;
export type InsertGameEvent = typeof gameEvents.$inferInsert;
export type GameStats = typeof gameStats.$inferSelect;
export type InsertGameStats = typeof gameStats.$inferInsert;

// Legacy compatibility (remove these when old code is updated)
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	username: text("username").notNull().unique(),
	password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
	username: true,
	password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
