export interface QuestionSet {
	name: string;
	description: string;
	defaultTimeLimit?: number;
	questionCount: number;
	questions?: Question[];
}

export interface Question {
	id: string;
	question: string;
	options: string[];
	correct: string;
	type: "sword" | "arrow" | "magic" | "fire";
	difficulty?: "easy" | "medium" | "hard";
	category?: string;
	explanation?: string;
}

export interface QuestionSetsResponse {
	success: boolean;
	questionSets?: QuestionSet[];
	error?: string;
}

export interface QuestionSetResponse {
	success: boolean;
	questionSet?: QuestionSet;
	error?: string;
}

export interface ImportResponse {
	success: boolean;
	message?: string;
	questions?: Array<{
		id: string;
		question: string;
		type: string;
		difficulty?: string;
		category?: string;
	}>;
	error?: string;
	details?: any[];
}

export interface CreateQuestionSetRequest {
	name: string;
	description: string;
	questions: Question[];
	defaultTimeLimit?: number;
}

const API_BASE = "/api";

class QuestionsApiService {
	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${API_BASE}${endpoint}`;
		
		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			...options,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
		}

		return response.json();
	}

	async getQuestionSets(): Promise<QuestionSetsResponse> {
		return this.request<QuestionSetsResponse>("/questions/sets");
	}

	async getQuestionSet(
		setName: string,
		includeQuestions = false
	): Promise<QuestionSetResponse> {
		const params = includeQuestions ? "?includeQuestions=true" : "";
		return this.request<QuestionSetResponse>(`/questions/sets/${setName}${params}`);
	}

	async importQuestionsFromJSON(questions: any[]): Promise<ImportResponse> {
		return this.request<ImportResponse>("/questions/import/json", {
			method: "POST",
			body: JSON.stringify({ questions }),
		});
	}

	async importQuestionsFromCSV(csvData: string): Promise<ImportResponse> {
		return this.request<ImportResponse>("/questions/import/csv", {
			method: "POST",
			headers: {
				"Content-Type": "text/plain",
			},
			body: csvData,
		});
	}

	async createQuestionSet(data: CreateQuestionSetRequest): Promise<{
		success: boolean;
		message?: string;
		questionSet?: {
			name: string;
			description: string;
			questionCount: number;
			defaultTimeLimit?: number;
		};
		error?: string;
		details?: any[];
	}> {
		return this.request("/questions/sets", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	async deleteQuestionSet(setName: string): Promise<{
		success: boolean;
		message?: string;
		error?: string;
	}> {
		return this.request(`/questions/sets/${setName}`, {
			method: "DELETE",
		});
	}

	async getCSVTemplate(): Promise<string> {
		const response = await fetch(`${API_BASE}/questions/template/csv`);
		
		if (!response.ok) {
			throw new Error("Failed to get CSV template");
		}
		
		return response.text();
	}

	async getJSONTemplate(): Promise<{
		success: boolean;
		template?: Question[];
		schema?: Record<string, string>;
		error?: string;
	}> {
		return this.request("/questions/template/json");
	}

	// Utility methods for question validation
	validateQuestion(question: Partial<Question>): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!question.id?.trim()) {
			errors.push("Question ID is required");
		}

		if (!question.question?.trim()) {
			errors.push("Question text is required");
		}

		if (!question.options || question.options.length < 2) {
			errors.push("At least 2 options are required");
		}

		if (!question.correct?.trim()) {
			errors.push("Correct answer is required");
		}

		if (question.correct && question.options && !question.options.includes(question.correct)) {
			errors.push("Correct answer must be one of the options");
		}

		if (!question.type || !["sword", "arrow", "magic", "fire"].includes(question.type)) {
			errors.push("Valid attack type is required (sword, arrow, magic, fire)");
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	validateQuestionSet(questions: Question[]): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];
		const ids = new Set<string>();

		if (questions.length === 0) {
			errors.push("At least one question is required");
		}

		questions.forEach((question, index) => {
			const validation = this.validateQuestion(question);
			
			if (!validation.isValid) {
				errors.push(`Question ${index + 1}: ${validation.errors.join(", ")}`);
			}

			if (question.id && ids.has(question.id)) {
				errors.push(`Question ${index + 1}: Duplicate ID "${question.id}"`);
			} else if (question.id) {
				ids.add(question.id);
			}
		});

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}

export const questionsApi = new QuestionsApiService();