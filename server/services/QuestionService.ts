import type { GameQuestion, InsertGameQuestion } from "@shared/schema";
import { gameStorage } from "../storage/gameStorage";

export interface QuestionTemplate {
	id: string;
	question: string;
	options: string[];
	correct: string;
	type: "sword" | "arrow" | "magic" | "fire";
	difficulty?: "easy" | "medium" | "hard";
	category?: string;
	explanation?: string;
}

export interface QuestionSet {
	name: string;
	description: string;
	questions: QuestionTemplate[];
	defaultTimeLimit?: number; // seconds
}

export interface CustomQuestionConfig {
	questions: QuestionTemplate[];
	timeLimit?: number; // Global time limit for all questions
	individualTimeLimits?: Record<string, number>; // Individual time limits by question ID
	randomOrder?: boolean;
	maxQuestions?: number; // Limit number of questions used
}

// Type guards and validation constants
const VALID_TYPES: QuestionTemplate["type"][] = [
	"sword",
	"arrow",
	"magic",
	"fire",
];
const VALID_DIFFICULTIES: NonNullable<QuestionTemplate["difficulty"]>[] = [
	"easy",
	"medium",
	"hard",
];

/**
 * Service for managing questions and question sets
 * Handles default question templates and custom question configuration
 */
export class QuestionService {
	/**
	 * Default question templates
	 */
	private defaultQuestions: QuestionTemplate[] = [
		{
			id: "q1",
			question: "Qual é a capital da França?",
			options: ["Londres", "Berlim", "Paris", "Madrid"],
			correct: "Paris",
			type: "sword",
			difficulty: "easy",
			category: "geografia",
		},
		{
			id: "q2",
			question: "Qual planeta é conhecido como o Planeta Vermelho?",
			options: ["Vênus", "Marte", "Júpiter", "Saturno"],
			correct: "Marte",
			type: "arrow",
			difficulty: "easy",
			category: "astronomia",
		},
		{
			id: "q3",
			question: "Quanto é 15 + 27?",
			options: ["40", "42", "45", "47"],
			correct: "42",
			type: "magic",
			difficulty: "easy",
			category: "matemática",
		},
		{
			id: "q4",
			question: "Quem pintou a Mona Lisa?",
			options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
			correct: "Da Vinci",
			type: "fire",
			difficulty: "medium",
			category: "arte",
		},
		{
			id: "q5",
			question: "Qual é o maior oceano da Terra?",
			options: ["Atlântico", "Índico", "Ártico", "Pacífico"],
			correct: "Pacífico",
			type: "sword",
			difficulty: "easy",
			category: "geografia",
		},
		{
			id: "q6",
			question: "Qual é o símbolo químico do ouro?",
			options: ["Go", "Gd", "Au", "Ag"],
			correct: "Au",
			type: "magic",
			difficulty: "medium",
			category: "química",
		},
		{
			id: "q7",
			question: "Quantos continentes existem?",
			options: ["5", "6", "7", "8"],
			correct: "7",
			type: "arrow",
			difficulty: "easy",
			category: "geografia",
		},
		{
			id: "q8",
			question: "Em que ano terminou a Segunda Guerra Mundial?",
			options: ["1943", "1944", "1945", "1946"],
			correct: "1945",
			type: "fire",
			difficulty: "medium",
			category: "história",
		},
		{
			id: "q9",
			question: "Qual é a fórmula química da água?",
			options: ["CO2", "H2O", "O2", "CH4"],
			correct: "H2O",
			type: "magic",
			difficulty: "easy",
			category: "química",
		},
		{
			id: "q10",
			question: "Quem escreveu 'Dom Casmurro'?",
			options: [
				"José de Alencar",
				"Machado de Assis",
				"Clarice Lispector",
				"Guimarães Rosa",
			],
			correct: "Machado de Assis",
			type: "sword",
			difficulty: "medium",
			category: "literatura",
		},
		{
			id: "q11",
			question: "Qual é a velocidade da luz no vácuo?",
			options: ["300.000 km/s", "150.000 km/s", "450.000 km/s", "600.000 km/s"],
			correct: "300.000 km/s",
			type: "arrow",
			difficulty: "hard",
			category: "física",
		},
		{
			id: "q12",
			question: "Em que ano foi proclamada a independência do Brasil?",
			options: ["1820", "1822", "1824", "1825"],
			correct: "1822",
			type: "fire",
			difficulty: "easy",
			category: "história",
		},
	];

	private questionSets: Record<string, QuestionSet> = {
		default: {
			name: "Conhecimentos Gerais",
			description: "Perguntas variadas de conhecimentos gerais",
			questions: this.defaultQuestions,
			defaultTimeLimit: 30,
		},
		easy: {
			name: "Nível Fácil",
			description: "Perguntas de nível fácil para iniciantes",
			questions: this.defaultQuestions.filter((q) => q.difficulty === "easy"),
			defaultTimeLimit: 45,
		},
		medium: {
			name: "Nível Médio",
			description: "Perguntas de nível médio",
			questions: this.defaultQuestions.filter((q) => q.difficulty === "medium"),
			defaultTimeLimit: 30,
		},
		hard: {
			name: "Nível Difícil",
			description: "Perguntas desafiadoras",
			questions: this.defaultQuestions.filter((q) => q.difficulty === "hard"),
			defaultTimeLimit: 20,
		},
		geography: {
			name: "Geografia",
			description: "Perguntas sobre geografia mundial",
			questions: this.defaultQuestions.filter(
				(q) => q.category === "geografia",
			),
			defaultTimeLimit: 30,
		},
		science: {
			name: "Ciências",
			description: "Perguntas de ciências (física, química, astronomia)",
			questions: this.defaultQuestions.filter((q) =>
				["química", "física", "astronomia"].includes(q.category || ""),
			),
			defaultTimeLimit: 25,
		},
	};

	/**
	 * Get available question sets
	 */
	getAvailableQuestionSets(): Record<
		string,
		Omit<QuestionSet, "questions"> & { questionCount: number }
	> {
		const sets: Record<
			string,
			Omit<QuestionSet, "questions"> & { questionCount: number }
		> = {};

		for (const [key, set] of Object.entries(this.questionSets)) {
			sets[key] = {
				name: set.name,
				description: set.description,
				defaultTimeLimit: set.defaultTimeLimit,
				questionCount: set.questions.length,
			};
		}

		return sets;
	}

	/**
	 * Get a specific question set
	 */
	getQuestionSet(setName: string): QuestionSet | null {
		return this.questionSets[setName] || null;
	}

	/**
	 * Load questions for a game using default template
	 */
	async loadQuestionsForGame(
		gameId: number,
		setName: string = "default",
		options: {
			maxQuestions?: number;
			randomOrder?: boolean;
			timeLimit?: number;
			individualTimeLimits?: Record<string, number>;
		} = {},
	): Promise<GameQuestion[]> {
		const questionSet = this.getQuestionSet(setName);
		if (!questionSet) {
			throw new Error(`Question set '${setName}' not found`);
		}

		let questions = [...questionSet.questions];

		// Randomize order if requested
		if (options.randomOrder) {
			questions = this.shuffleArray(questions);
		}

		// Limit number of questions
		if (
			options.maxQuestions &&
			options.maxQuestions > 0 &&
			options.maxQuestions < questions.length
		) {
			questions = questions.slice(0, options.maxQuestions);
		}

		// Convert to GameQuestion format
		const gameQuestions: Omit<InsertGameQuestion, "gameId">[] = questions.map(
			(q, index) => ({
				questionData: q,
				position: index + 1,
				timeLimit:
					options.individualTimeLimits?.[q.id] ||
					options.timeLimit ||
					questionSet.defaultTimeLimit ||
					30,
			}),
		);

		// Save to database
		const savedQuestions = await gameStorage.addQuestionsToGame(
			gameId,
			gameQuestions,
		);

		console.log(
			`📚 Loaded ${savedQuestions.length} questions for game ${gameId} using set '${setName}'`,
		);
		return savedQuestions;
	}

	/**
	 * Load custom questions for a game
	 */
	async loadCustomQuestions(
		gameId: number,
		config: CustomQuestionConfig,
	): Promise<GameQuestion[]> {
		if (!config.questions || config.questions.length === 0) {
			throw new Error("No questions provided in config");
		}

		let questions = [...config.questions];

		// Validate questions
		const validationErrors: string[] = [];
		for (const [index, question] of questions.entries()) {
			const validation = this.validateQuestion(question);
			if (!validation.isValid) {
				validationErrors.push(
					`Question ${index + 1} (${question.id || "unknown"}): ${validation.errors.join(", ")}`,
				);
			}
		}

		if (validationErrors.length > 0) {
			throw new Error(
				`Invalid questions found:\n${validationErrors.join("\n")}`,
			);
		}

		// Randomize order if requested
		if (config.randomOrder) {
			questions = this.shuffleArray(questions);
		}

		// Limit number of questions
		if (
			config.maxQuestions &&
			config.maxQuestions > 0 &&
			config.maxQuestions < questions.length
		) {
			questions = questions.slice(0, config.maxQuestions);
		}

		// Convert to GameQuestion format
		const gameQuestions: Omit<InsertGameQuestion, "gameId">[] = questions.map(
			(q, index) => ({
				questionData: q,
				position: index + 1,
				timeLimit:
					config.individualTimeLimits?.[q.id] || config.timeLimit || 30,
			}),
		);

		// Save to database
		const savedQuestions = await gameStorage.addQuestionsToGame(
			gameId,
			gameQuestions,
		);

		console.log(
			`📝 Loaded ${savedQuestions.length} custom questions for game ${gameId}`,
		);
		return savedQuestions;
	}

	/**
	 * Import questions from JSON file
	 */
	importQuestionsFromJSON(jsonData: any): {
		questions: QuestionTemplate[];
		errors: string[];
	} {
		if (!Array.isArray(jsonData)) {
			throw new Error("JSON data must be an array of questions");
		}

		const questions: QuestionTemplate[] = [];
		const errors: string[] = [];

		for (const [index, item] of jsonData.entries()) {
			const validation = this.validateQuestion(item);
			if (validation.isValid) {
				questions.push(item);
			} else {
				errors.push(`Item ${index + 1}: ${validation.errors.join(", ")}`);
			}
		}

		return { questions, errors };
	}

	/**
	 * Import questions from CSV data - Improved CSV parsing
	 */
	importQuestionsFromCSV(csvData: string): {
		questions: QuestionTemplate[];
		errors: string[];
	} {
		const lines = csvData.split("\n").filter((line) => line.trim());
		if (lines.length < 2) {
			throw new Error("CSV must have header and at least one question");
		}

		const headers = this.parseCSVLine(lines[0]).map((h) =>
			h.trim().toLowerCase(),
		);
		const questions: QuestionTemplate[] = [];
		const errors: string[] = [];

		// Expected headers mapping
		const headerMap = {
			id: ["id", "identifier"],
			question: ["question", "pergunta", "texto"],
			option1: ["option1", "opcao1", "resposta1"],
			option2: ["option2", "opcao2", "resposta2"],
			option3: ["option3", "opcao3", "resposta3"],
			option4: ["option4", "opcao4", "resposta4"],
			correct: ["correct", "correta", "resposta_correta"],
			type: ["type", "tipo"],
			difficulty: ["difficulty", "dificuldade"],
			category: ["category", "categoria"],
			explanation: ["explanation", "explicacao"],
		};

		// Find header indices
		const headerIndices: Record<string, number> = {};
		for (const [key, possibleNames] of Object.entries(headerMap)) {
			for (const name of possibleNames) {
				const index = headers.indexOf(name);
				if (index !== -1) {
					headerIndices[key] = index;
					break;
				}
			}
		}

		// Validate required headers
		const requiredHeaders = [
			"question",
			"option1",
			"option2",
			"correct",
			"type",
		];
		const missingHeaders = requiredHeaders.filter(
			(header) => !(header in headerIndices),
		);
		if (missingHeaders.length > 0) {
			throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
		}

		for (let i = 1; i < lines.length; i++) {
			try {
				const values = this.parseCSVLine(lines[i]);

				if (values.length < Math.max(...Object.values(headerIndices)) + 1) {
					errors.push(`Line ${i + 1}: Insufficient columns`);
					continue;
				}

				const options = [
					values[headerIndices.option1]?.trim(),
					values[headerIndices.option2]?.trim(),
					values[headerIndices.option3]?.trim(),
					values[headerIndices.option4]?.trim(),
				].filter(Boolean);

				const question: QuestionTemplate = {
					id: values[headerIndices.id]?.trim() || `q${i}`,
					question: values[headerIndices.question]?.trim() || "",
					options,
					correct: values[headerIndices.correct]?.trim() || "",
					type:
						this.normalizeType(values[headerIndices.type]?.trim()) || "sword",
					difficulty: this.normalizeDifficulty(
						values[headerIndices.difficulty]?.trim(),
					),
					category: values[headerIndices.category]?.trim() || "geral",
					explanation: values[headerIndices.explanation]?.trim(),
				};

				const validation = this.validateQuestion(question);
				if (validation.isValid) {
					questions.push(question);
				} else {
					errors.push(`Line ${i + 1}: ${validation.errors.join(", ")}`);
				}
			} catch (error) {
				errors.push(
					`Line ${i + 1}: Parse error - ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}

		return { questions, errors };
	}

	/**
	 * Parse CSV line handling quoted fields and escaped quotes
	 */
	private parseCSVLine(line: string): string[] {
		const result: string[] = [];
		let current = "";
		let inQuotes = false;
		let i = 0;

		while (i < line.length) {
			const char = line[i];

			if (char === '"' && !inQuotes) {
				inQuotes = true;
			} else if (char === '"' && inQuotes) {
				if (i + 1 < line.length && line[i + 1] === '"') {
					// Escaped quote
					current += '"';
					i++; // Skip next quote
				} else {
					inQuotes = false;
				}
			} else if (char === "," && !inQuotes) {
				result.push(current.trim());
				current = "";
			} else {
				current += char;
			}
			i++;
		}

		result.push(current.trim());
		return result;
	}

	/**
	 * Normalize and validate type
	 */
	private normalizeType(type: string | undefined): QuestionTemplate["type"] {
		if (!type) return "sword";

		const normalized = type.toLowerCase().trim();
		const typeMap: Record<string, QuestionTemplate["type"]> = {
			sword: "sword",
			espada: "sword",
			arrow: "arrow",
			flecha: "arrow",
			magic: "magic",
			magia: "magic",
			fire: "fire",
			fogo: "fire",
		};

		return typeMap[normalized] || "sword";
	}

	/**
	 * Normalize and validate difficulty
	 */
	private normalizeDifficulty(
		difficulty: string | undefined,
	): QuestionTemplate["difficulty"] {
		if (!difficulty) return "medium";

		const normalized = difficulty.toLowerCase().trim();
		const difficultyMap: Record<string, QuestionTemplate["difficulty"]> = {
			easy: "easy",
			facil: "easy",
			fácil: "easy",
			medium: "medium",
			medio: "medium",
			médio: "medium",
			hard: "hard",
			dificil: "hard",
			difícil: "hard",
		};

		return difficultyMap[normalized] || "medium";
	}

	/**
	 * Get questions for a specific game
	 */
	async getGameQuestions(gameId: number): Promise<GameQuestion[]> {
		return await gameStorage.getGameQuestions(gameId);
	}

	/**
	 * Enhanced question validation with detailed error reporting
	 */
	private validateQuestion(question: any): {
		isValid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!question || typeof question !== "object") {
			return { isValid: false, errors: ["Question must be an object"] };
		}

		// Validate ID
		if (
			!question.id ||
			typeof question.id !== "string" ||
			question.id.trim() === ""
		) {
			errors.push("ID is required and must be a non-empty string");
		}

		// Validate question text
		if (
			!question.question ||
			typeof question.question !== "string" ||
			question.question.trim() === ""
		) {
			errors.push("Question text is required and must be a non-empty string");
		}

		// Validate options
		if (!Array.isArray(question.options)) {
			errors.push("Options must be an array");
		} else if (question.options.length < 2) {
			errors.push("At least 2 options are required");
		} else if (
			question.options.some(
				(opt: any) => !opt || typeof opt !== "string" || opt.trim() === "",
			)
		) {
			errors.push("All options must be non-empty strings");
		}

		// Validate correct answer
		if (!question.correct || typeof question.correct !== "string") {
			errors.push("Correct answer is required and must be a string");
		} else if (
			Array.isArray(question.options) &&
			!question.options.includes(question.correct)
		) {
			errors.push("Correct answer must be one of the options");
		}

		// Validate type
		if (!question.type || !VALID_TYPES.includes(question.type)) {
			errors.push(`Type must be one of: ${VALID_TYPES.join(", ")}`);
		}

		// Validate difficulty (optional)
		if (
			question.difficulty &&
			!VALID_DIFFICULTIES.includes(question.difficulty)
		) {
			errors.push(
				`Difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`,
			);
		}

		return { isValid: errors.length === 0, errors };
	}

	/**
	 * Legacy validation method for backward compatibility
	 */
	private isValidQuestion(question: any): question is QuestionTemplate {
		return this.validateQuestion(question).isValid;
	}

	/**
	 * Shuffle array using Fisher-Yates algorithm
	 */
	private shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	/**
	 * Create a custom question set
	 */
	createCustomQuestionSet(name: string, questionSet: QuestionSet): void {
		if (!name || name.trim() === "") {
			throw new Error("Question set name is required");
		}

		if (!questionSet.questions || questionSet.questions.length === 0) {
			throw new Error("Question set must contain at least one question");
		}

		// Validate all questions in the set
		const errors: string[] = [];
		for (const [index, question] of questionSet.questions.entries()) {
			const validation = this.validateQuestion(question);
			if (!validation.isValid) {
				errors.push(`Question ${index + 1}: ${validation.errors.join(", ")}`);
			}
		}

		if (errors.length > 0) {
			throw new Error(`Invalid questions in set:\n${errors.join("\n")}`);
		}

		this.questionSets[name] = questionSet;
		console.log(
			`➕ Created custom question set: ${name} (${questionSet.questions.length} questions)`,
		);
	}

	/**
	 * Remove a custom question set
	 */
	removeQuestionSet(name: string): boolean {
		// Don't allow removing default sets
		const protectedSets = [
			"default",
			"easy",
			"medium",
			"hard",
			"geography",
			"science",
		];
		if (protectedSets.includes(name)) {
			console.warn(`Cannot remove protected question set: ${name}`);
			return false;
		}

		if (this.questionSets[name]) {
			delete this.questionSets[name];
			console.log(`➖ Removed question set: ${name}`);
			return true;
		}

		return false;
	}

	/**
	 * Get statistics about question sets
	 */
	getQuestionSetStats() {
		const stats = {
			totalSets: Object.keys(this.questionSets).length,
			totalQuestions: 0,
			questionsByType: { sword: 0, arrow: 0, magic: 0, fire: 0 },
			questionsByDifficulty: { easy: 0, medium: 0, hard: 0 },
			questionsByCategory: {} as Record<string, number>,
		};

		for (const set of Object.values(this.questionSets)) {
			for (const question of set.questions) {
				stats.totalQuestions++;
				stats.questionsByType[question.type]++;

				if (question.difficulty) {
					stats.questionsByDifficulty[question.difficulty]++;
				}

				if (question.category) {
					stats.questionsByCategory[question.category] =
						(stats.questionsByCategory[question.category] || 0) + 1;
				}
			}
		}

		return stats;
	}
}

// Export singleton instance
export const questionService = new QuestionService();
