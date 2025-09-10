import { Router, type Request, type Response } from "express";
import { questionService } from "../services";
import { z } from "zod";

const router = Router();

// Validation schemas
const importJsonSchema = z.object({
	questions: z.array(z.any()),
});

const createQuestionSetSchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().min(1).max(200),
	questions: z.array(z.object({
		id: z.string(),
		question: z.string().min(1),
		options: z.array(z.string()).min(2),
		correct: z.string(),
		type: z.enum(["sword", "arrow", "magic", "fire"]),
		difficulty: z.enum(["easy", "medium", "hard"]).optional(),
		category: z.string().optional(),
		explanation: z.string().optional(),
	})),
	defaultTimeLimit: z.number().min(5).max(120).optional(),
});

/**
 * GET /api/questions/sets
 * Get all available question sets
 */
router.get("/sets", (req: Request, res: Response) => {
	try {
		const questionSets = questionService.getAvailableQuestionSets();
		
		res.json({
			success: true,
			questionSets,
		});
	} catch (error) {
		console.error("Error getting question sets:", error);
		
		res.status(500).json({
			success: false,
			error: "Failed to get question sets",
		});
	}
});

/**
 * GET /api/questions/sets/:setName
 * Get a specific question set with all questions
 */
router.get("/sets/:setName", (req: Request, res: Response) => {
	try {
		const { setName } = req.params;
		const includeQuestions = req.query.includeQuestions === 'true';
		
		const questionSet = questionService.getQuestionSet(setName);
		
		if (!questionSet) {
			return res.status(404).json({
				success: false,
				error: "Question set not found",
			});
		}
		
		const response: any = {
			name: questionSet.name,
			description: questionSet.description,
			defaultTimeLimit: questionSet.defaultTimeLimit,
			questionCount: questionSet.questions.length,
		};
		
		if (includeQuestions) {
			response.questions = questionSet.questions;
		}
		
		res.json({
			success: true,
			questionSet: response,
		});
	} catch (error) {
		console.error("Error getting question set:", error);
		
		res.status(500).json({
			success: false,
			error: "Failed to get question set",
		});
	}
});

/**
 * POST /api/questions/import/json
 * Import questions from JSON data
 */
router.post("/import/json", (req: Request, res: Response) => {
	try {
		const { questions: questionsData } = importJsonSchema.parse(req.body);
		
		const questions = questionService.importQuestionsFromJSON(questionsData);
		
		res.json({
			success: true,
			message: `Successfully imported ${questions.length} questions`,
			questions: questions.map(q => ({
				id: q.id,
				question: q.question,
				type: q.type,
				difficulty: q.difficulty,
				category: q.category,
			})),
		});
	} catch (error) {
		console.error("Error importing JSON questions:", error);
		
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				success: false,
				error: "Invalid JSON data",
				details: error.errors,
			});
		}
		
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : "Failed to import questions",
		});
	}
});

/**
 * POST /api/questions/import/csv
 * Import questions from CSV data
 */
router.post("/import/csv", (req: Request, res: Response) => {
	try {
		const csvData = req.body;
		
		if (typeof csvData !== 'string') {
			return res.status(400).json({
				success: false,
				error: "Request body must be CSV text",
			});
		}
		
		const questions = questionService.importQuestionsFromCSV(csvData);
		
		res.json({
			success: true,
			message: `Successfully imported ${questions.length} questions`,
			questions: questions.map(q => ({
				id: q.id,
				question: q.question,
				type: q.type,
				difficulty: q.difficulty,
				category: q.category,
			})),
		});
	} catch (error) {
		console.error("Error importing CSV questions:", error);
		
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : "Failed to import questions",
		});
	}
});

/**
 * POST /api/questions/sets
 * Create a custom question set
 */
router.post("/sets", (req: Request, res: Response) => {
	try {
		const questionSetData = createQuestionSetSchema.parse(req.body);
		
		// Create the custom question set
		questionService.createCustomQuestionSet(questionSetData.name, {
			name: questionSetData.name,
			description: questionSetData.description,
			questions: questionSetData.questions,
			defaultTimeLimit: questionSetData.defaultTimeLimit,
		});
		
		res.status(201).json({
			success: true,
			message: `Question set '${questionSetData.name}' created successfully`,
			questionSet: {
				name: questionSetData.name,
				description: questionSetData.description,
				questionCount: questionSetData.questions.length,
				defaultTimeLimit: questionSetData.defaultTimeLimit,
			},
		});
	} catch (error) {
		console.error("Error creating question set:", error);
		
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				success: false,
				error: "Invalid question set data",
				details: error.errors,
			});
		}
		
		res.status(500).json({
			success: false,
			error: "Failed to create question set",
		});
	}
});

/**
 * DELETE /api/questions/sets/:setName
 * Delete a custom question set
 */
router.delete("/sets/:setName", (req: Request, res: Response) => {
	try {
		const { setName } = req.params;
		
		const success = questionService.removeQuestionSet(setName);
		
		if (!success) {
			return res.status(404).json({
				success: false,
				error: "Question set not found or cannot be deleted (default sets are protected)",
			});
		}
		
		res.json({
			success: true,
			message: `Question set '${setName}' deleted successfully`,
		});
	} catch (error) {
		console.error("Error deleting question set:", error);
		
		res.status(500).json({
			success: false,
			error: "Failed to delete question set",
		});
	}
});

/**
 * GET /api/questions/template/csv
 * Get CSV template for question import
 */
router.get("/template/csv", (req: Request, res: Response) => {
	try {
		const csvTemplate = [
			"id,question,option1,option2,option3,option4,correct,type,difficulty,category",
			"q1,Qual é a capital da França?,Londres,Berlim,Paris,Madrid,Paris,sword,easy,geografia",
			"q2,Quanto é 2 + 2?,3,4,5,6,4,magic,easy,matemática",
		].join('\n');
		
		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'attachment; filename="questions-template.csv"');
		res.send(csvTemplate);
	} catch (error) {
		console.error("Error generating CSV template:", error);
		
		res.status(500).json({
			success: false,
			error: "Failed to generate CSV template",
		});
	}
});

/**
 * GET /api/questions/template/json
 * Get JSON template for question import
 */
router.get("/template/json", (req: Request, res: Response) => {
	try {
		const jsonTemplate = [
			{
				id: "q1",
				question: "Qual é a capital da França?",
				options: ["Londres", "Berlim", "Paris", "Madrid"],
				correct: "Paris",
				type: "sword",
				difficulty: "easy",
				category: "geografia",
				explanation: "Paris é a capital e maior cidade da França.",
			},
			{
				id: "q2",
				question: "Quanto é 2 + 2?",
				options: ["3", "4", "5", "6"],
				correct: "4",
				type: "magic",
				difficulty: "easy",
				category: "matemática",
				explanation: "2 + 2 = 4 (adição básica).",
			},
		];
		
		res.json({
			success: true,
			template: jsonTemplate,
			schema: {
				id: "string (unique identifier for the question)",
				question: "string (the question text)",
				options: "array of strings (answer options)",
				correct: "string (the correct answer, must match one of the options)",
				type: "enum: sword|arrow|magic|fire (attack type for correct answers)",
				difficulty: "enum: easy|medium|hard (optional difficulty level)",
				category: "string (optional category for the question)",
				explanation: "string (optional explanation for the answer)",
			},
		});
	} catch (error) {
		console.error("Error generating JSON template:", error);
		
		res.status(500).json({
			success: false,
			error: "Failed to generate JSON template",
		});
	}
});

export { router as questionRoutes };