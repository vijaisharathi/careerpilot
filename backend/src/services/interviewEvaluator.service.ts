import {
  IInterviewQuestion,
  IQuestionEvaluation,
} from '../models/interviewSession.model';
import { llmService } from './ai';
import { logger } from '../utils/logger';

export interface EvaluationInput {
  question: IInterviewQuestion;
  studentAnswer: string;
  targetRole: string;
}

export class InterviewEvaluatorService {
  /**
   * Evaluates a student's interview response against explicit, transparent rubrics.
   */
  public async evaluateAnswer(input: EvaluationInput): Promise<IQuestionEvaluation> {
    const { question, studentAnswer, targetRole } = input;
    const cleanAnswer = studentAnswer.trim();

    // Try dynamic LLM evaluation if configured and live
    try {
      if (llmService.getStatus().isConfigured && !llmService.getStatus().isSimulated) {
        const llmEval = await this.evaluateWithLlm(input);
        if (llmEval) return llmEval;
      }
    } catch (err) {
      logger.warn('[InterviewEvaluator] LLM evaluation exception, applying deterministic rubric:', err);
    }

    // Deterministic transparent rubric evaluation fallback
    return this.evaluateWithRubric(question, cleanAnswer, targetRole);
  }

  private evaluateWithRubric(
    question: IInterviewQuestion,
    answer: string,
    targetRole: string
  ): IQuestionEvaluation {
    const words = answer.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const lowerAnswer = answer.toLowerCase();

    // 1. Check for insufficient or excessively brief answers
    if (wordCount < 15) {
      return {
        overallScore: Math.min(35, Math.max(10, wordCount * 2)),
        correctness: 25,
        completeness: 20,
        clarity: 30,
        strengths: ['Attempted the question prompt.'],
        missingConcepts: question.expectedKeyConcepts,
        feedback:
          'Your answer was too brief to assess technical or behavioral competency accurately. A solid interview response should thoroughly address the prompt and elaborate on trade-offs.',
        suggestedImprovedAnswer:
          question.idealAnswerOutline ||
          `A strong response for a ${targetRole} candidate should cover ${question.expectedKeyConcepts.join(', ')} with specific technical examples.`,
        isUncertainAssessment: true,
        rubricExplanation:
          'Insufficient response length (< 15 words). The assessment has high uncertainty due to lack of substantive technical detail.',
      };
    }

    // 2. Identify Matched vs Missing Concepts
    const expected = question.expectedKeyConcepts || [];
    const matchedConcepts: string[] = [];
    const missingConcepts: string[] = [];

    for (const concept of expected) {
      const lowerConcept = concept.toLowerCase();
      // Check if concept or parts of it appear in answer
      const conceptTokens = lowerConcept.split(/\s+/);
      const isMatched =
        lowerAnswer.includes(lowerConcept) ||
        conceptTokens.filter((token) => token.length > 3 && lowerAnswer.includes(token)).length >=
          Math.ceil(conceptTokens.length / 2);

      if (isMatched) {
        matchedConcepts.push(concept);
      } else {
        missingConcepts.push(concept);
      }
    }

    // 3. Technical vs HR Scoring Calculations
    let correctness = 70;
    let completeness = 65;
    let clarity = 75;
    const strengths: string[] = [];
    let feedback = '';

    if (question.category === 'technical') {
      // Concept coverage ratio (0 to 1)
      const conceptRatio = expected.length > 0 ? matchedConcepts.length / expected.length : 0.7;
      completeness = Math.round(conceptRatio * 60 + Math.min(40, (wordCount / 100) * 40));

      // Correctness based on depth and keyword matches
      correctness = Math.round(50 + conceptRatio * 45);
      if (wordCount < 40) correctness = Math.min(correctness, 60);

      // Clarity based on length and paragraph structure
      clarity = answer.includes('\n') || words.length >= 50 ? 85 : 72;

      // Strengths
      if (matchedConcepts.length > 0) {
        strengths.push(`Clearly identified core concepts: ${matchedConcepts.slice(0, 3).join(', ')}.`);
      }
      if (wordCount >= 60) {
        strengths.push('Provided substantive explanations rather than one-line definitions.');
      }
      if (/e\.g\.|for example|in my project|specifically/i.test(answer)) {
        strengths.push('Grounded response with practical implementation examples.');
      }

      // Feedback
      if (missingConcepts.length > 0) {
        feedback = `Good foundational response. To elevate this answer to Senior ${targetRole} quality, incorporate ${missingConcepts.slice(0, 2).join(' and ')} and articulate operational trade-offs.`;
      } else {
        feedback =
          'Strong technical answer covering all core requirements. Great job explaining both the implementation mechanics and architectural implications.';
      }
    } else {
      // HR & Behavioral Interview Scoring (STAR Method Evaluation)
      const hasSituation = /situation|when I was|during|at my previous|in my team/i.test(lowerAnswer);
      const hasTask = /task|goal|responsible for|objective|challenge/i.test(lowerAnswer);
      const hasAction = /action|I decided|I implemented|I scheduled|I spoke with|I researched/i.test(lowerAnswer);
      const hasResult = /result|outcome|delivered|improved|learned|successfully/i.test(lowerAnswer);

      let starCount = 0;
      if (hasSituation) starCount++;
      if (hasTask) starCount++;
      if (hasAction) starCount++;
      if (hasResult) starCount++;

      completeness = Math.round((starCount / 4) * 60 + Math.min(40, (wordCount / 80) * 40));
      correctness = Math.round(55 + (starCount / 4) * 40);
      clarity = wordCount >= 60 ? 85 : 70;

      if (hasAction) strengths.push('Specified personal actions and initiative clearly.');
      if (hasResult) strengths.push('Closed response with concrete results and project outcomes.');
      if (matchedConcepts.length > 0) {
        strengths.push(`Addressed expected behavioral competencies: ${matchedConcepts.join(', ')}.`);
      }

      if (starCount < 3) {
        feedback =
          'Your narrative makes good points, but would benefit from a tighter STAR structure (Situation -> Task -> Action -> Result) to highlight your exact personal contribution.';
      } else {
        feedback =
          'Well-structured behavioral response demonstrating proactive communication, technical ownership, and clear results.';
      }
    }

    // Bound scores between 10 and 100
    correctness = Math.max(10, Math.min(98, correctness));
    completeness = Math.max(10, Math.min(98, completeness));
    clarity = Math.max(10, Math.min(98, clarity));

    const overallScore = Math.round(
      correctness * 0.4 + completeness * 0.35 + clarity * 0.25
    );

    const rubricExplanation =
      question.category === 'technical'
        ? `Evaluated using Technical Criteria Rubric: Correctness (${correctness}%), Completeness (${completeness}%), and Clarity (${clarity}%). Note: Subjective communication indicators are formative feedback rather than definitive assessments.`
        : `Evaluated using Behavioral STAR Rubric: Situation/Task context, Action ownership, and Result clarity. Note: Communication scores reflect structured alignment rather than personality evaluation.`;

    const suggestedImprovedAnswer =
      question.idealAnswerOutline ||
      `For a ${question.difficulty} ${targetRole} interview: Structure your answer by defining the core principle, walking through the architectural mechanics (${expected.slice(0, 3).join(', ')}), and discussing production trade-offs with metrics.`;

    return {
      overallScore,
      correctness,
      completeness,
      clarity,
      strengths: strengths.length > 0 ? strengths : ['Articulated a reasoned point of view.'],
      missingConcepts,
      feedback,
      suggestedImprovedAnswer,
      isUncertainAssessment: wordCount < 30,
      rubricExplanation,
    };
  }

  private async evaluateWithLlm(input: EvaluationInput): Promise<IQuestionEvaluation | null> {
    const { question, studentAnswer, targetRole } = input;

    const prompt = `You are a Principal Technical Interviewer evaluating a candidate for a ${targetRole} position.
QUESTION DETAILS:
- Category: ${question.category}
- Topic: ${question.topic}
- Question: "${question.questionText}"
- Expected Key Concepts: ${question.expectedKeyConcepts.join(', ')}

CANDIDATE ANSWER:
"${studentAnswer}"

Evaluate strictly against:
1. Technical correctness and accuracy (0-100)
2. Completeness and coverage of key concepts (0-100)
3. Clarity, structure, and articulation (0-100)

Return ONLY a valid JSON object matching this schema:
{
  "overallScore": 85,
  "correctness": 85,
  "completeness": 80,
  "clarity": 90,
  "strengths": ["Clear understanding of X", "Good practical example"],
  "missingConcepts": ["Mentioned A, but missed B"],
  "feedback": "Constructive 2-3 sentence feedback explaining strengths and how to elevate the answer",
  "suggestedImprovedAnswer": "A concise 2-3 sentence model answer illustrating how a Senior candidate would respond",
  "isUncertainAssessment": false,
  "rubricExplanation": "Evaluated against role-specific technical accuracy and concept coverage rubrics."
}`;

    const response = await llmService.generateCompletion(prompt, { temperature: 0.2 });
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed.overallScore !== 'number') return null;

    return {
      overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore))),
      correctness: Math.max(0, Math.min(100, Math.round(parsed.correctness || 70))),
      completeness: Math.max(0, Math.min(100, Math.round(parsed.completeness || 70))),
      clarity: Math.max(0, Math.min(100, Math.round(parsed.clarity || 70))),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Demonstrated relevant knowledge.'],
      missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts : [],
      feedback: parsed.feedback || 'Good attempt addressing the question requirements.',
      suggestedImprovedAnswer:
        parsed.suggestedImprovedAnswer || question.idealAnswerOutline || 'Focus on structured trade-offs.',
      isUncertainAssessment: Boolean(parsed.isUncertainAssessment),
      rubricExplanation: parsed.rubricExplanation || 'Evaluated against standard interview criteria.',
    };
  }
}

export const interviewEvaluatorService = new InterviewEvaluatorService();

