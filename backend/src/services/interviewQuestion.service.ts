import {
  InterviewType,
  InterviewDifficulty,
  IInterviewQuestion,
} from '../models/interviewSession.model';
import { llmService } from './ai';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

export interface GenerateQuestionsInput {
  targetRole: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  questionCount: number;
  topics?: string[];
}

interface CatalogQuestion {
  roleKeywords: string[];
  category: InterviewType;
  topic: string;
  difficulty: InterviewDifficulty;
  questionText: string;
  contextOrScenario?: string;
  hints: string[];
  expectedKeyConcepts: string[];
  idealAnswerOutline: string;
}

export const INTERVIEW_QUESTION_CATALOG: CatalogQuestion[] = [
  // TECHNICAL: Full-Stack / Frontend / Backend
  {
    roleKeywords: ['full-stack', 'frontend', 'web', 'react', 'software'],
    category: 'technical',
    topic: 'React State & Reconciliation',
    difficulty: 'Intermediate',
    questionText:
      'Explain how React virtual DOM diffing works and why updating state causes re-renders. How do you prevent unnecessary re-renders in complex component subtrees?',
    contextOrScenario:
      'Imagine an analytics dashboard with 50 live chart widgets where a single filter update triggers noticeable frame drops.',
    hints: [
      'Mention reconciliation, fiber tree, keys, memoization with useMemo and useCallback, and React.memo.',
    ],
    expectedKeyConcepts: [
      'Virtual DOM',
      'Reconciliation algorithm',
      'React.memo / PureComponent',
      'useCallback & useMemo',
      'Keys for stable identity',
    ],
    idealAnswerOutline:
      'Discuss how React maintains two virtual trees (current vs work-in-progress), checks diffs in O(n) via heuristic rules (element types and keys), and triggers reconciliation. Explain memoization techniques and proper state colocation to isolate re-render scope.',
  },
  {
    roleKeywords: ['full-stack', 'backend', 'api', 'node', 'software'],
    category: 'technical',
    topic: 'REST API Design & Idempotency',
    difficulty: 'Intermediate',
    questionText:
      'What makes an HTTP method idempotent? How would you design an idempotent POST API for payment processing that prevents double-charging during network timeouts?',
    contextOrScenario:
      'A mobile client submits an order payment, loses connection before receiving a 200 OK, and retries the request automatically.',
    hints: [
      'Explain GET/PUT/DELETE vs POST idempotency, Idempotency-Key header, and atomic database check or Redis distributed lock.',
    ],
    expectedKeyConcepts: [
      'Idempotence definition',
      'Idempotency Keys / Tokens',
      'Distributed locking (Redis SETNX)',
      'Transaction atomicity',
      'HTTP status codes (409 Conflict, 200 with cached result)',
    ],
    idealAnswerOutline:
      'Define idempotence as executing an operation multiple times yielding the same server state. Explain using unique client-generated Idempotency-Key stored in cache/database with status (pending, completed), returning previously computed results on duplicate submissions.',
  },
  {
    roleKeywords: ['backend', 'full-stack', 'database', 'system design', 'cloud'],
    category: 'technical',
    topic: 'Relational vs NoSQL Database Selection',
    difficulty: 'Beginner',
    questionText:
      'Compare relational databases (PostgreSQL/MySQL) with document stores (MongoDB). In what business scenarios would you choose one over the other?',
    contextOrScenario:
      'An e-commerce startup is building its core platform: product catalog with varying attributes vs customer order financial ledgers.',
    hints: [
      'Discuss ACID compliance vs horizontal scalability, schema flexibility, joins, and data consistency models.',
    ],
    expectedKeyConcepts: [
      'ACID transactions vs BASE eventual consistency',
      'Structured schema vs JSON document flexibility',
      'Foreign keys and relational joins',
      'Horizontal sharding vs vertical scaling',
      'Use-case trade-offs',
    ],
    idealAnswerOutline:
      'Highlight ACID compliance and structured relational integrity for financial ledgers, vs schema flexibility, hierarchical documents, and easy horizontal sharding in MongoDB for dynamic catalogs and real-time feeds.',
  },
  {
    roleKeywords: ['backend', 'full-stack', 'system design', 'cloud', 'devops'],
    category: 'technical',
    topic: 'System Scalability & Caching Strategies',
    difficulty: 'Advanced',
    questionText:
      'Describe how you would design a high-throughput caching layer with Redis. How do you handle cache invalidation, cache stampede (thundering herd), and cache penetration?',
    contextOrScenario:
      'A trending news site experiences sudden 100x traffic spikes when breaking news articles are published.',
    hints: [
      'Discuss Cache-Aside, Write-Through, mutex locking for cache misses, probabilistic early expiration, and Bloom filters for non-existent keys.',
    ],
    expectedKeyConcepts: [
      'Cache-Aside (Lazy loading) vs Write-Through',
      'Cache Stampede & Mutex lock',
      'Cache Penetration & Bloom Filters',
      'Cache Invalidation / TTL strategies',
      'Memory eviction policies (LRU/LFU)',
    ],
    idealAnswerOutline:
      'Explain Cache-Aside pattern. Address cache stampede using distributed locks (mutex) or XFetch probabilistic expiration so only one worker queries the database on expiration. Counter cache penetration with Bloom filters and caching null results.',
  },
  {
    roleKeywords: ['data', 'python', 'machine learning', 'ai', 'data science'],
    category: 'technical',
    topic: 'Machine Learning Overfitting & Regularization',
    difficulty: 'Intermediate',
    questionText:
      'What causes a machine learning model to overfit on training data? What specific mathematical and structural techniques do you employ to prevent it across both classical models and deep neural networks?',
    contextOrScenario:
      'A customer churn prediction model achieves 99% accuracy on training data but only 64% on the validation set.',
    hints: [
      'Discuss Bias-Variance tradeoff, L1 (Lasso) vs L2 (Ridge) penalties, Dropout, Early Stopping, and Cross-Validation.',
    ],
    expectedKeyConcepts: [
      'High variance / Low bias dilemma',
      'L1 (Lasso) vs L2 (Ridge) weight decay',
      'Dropout in neural layers',
      'K-fold cross validation',
      'Data augmentation & Early stopping',
    ],
    idealAnswerOutline:
      'Explain high variance capturing noise rather than true signal. Detail L1 causing sparsity and L2 penalizing large weights. For neural networks, explain Dropout randomly deactivating neurons and early stopping monitoring validation loss.',
  },
  {
    roleKeywords: ['cloud', 'devops', 'cybersecurity', 'infrastructure'],
    category: 'technical',
    topic: 'Containerization & Microservice Networking',
    difficulty: 'Intermediate',
    questionText:
      'Explain the difference between containerization (Docker) and traditional virtualization (VMs). How do container networks communicate securely in a Kubernetes cluster?',
    contextOrScenario:
      'Migrating a legacy monolithic enterprise application into modern orchestrated containers.',
    hints: [
      'Compare shared OS kernel vs hypervisor guest OS, and discuss network namespaces, CNI, and Service discovery.',
    ],
    expectedKeyConcepts: [
      'Shared kernel vs Hypervisor guest OS',
      'Resource overhead and startup latency',
      'Linux cgroups and namespaces',
      'Kubernetes Pod networking & Services',
      'Ingress and Network Policies',
    ],
    idealAnswerOutline:
      'Contrast container isolation via Linux namespaces/cgroups sharing the host kernel vs VMs running full guest OS via Hypervisors. Explain Kubernetes cluster networking where every pod gets an IP, using ClusterIP services and network policies for microsegmentation.',
  },

  // HR & BEHAVIORAL INTERVIEW QUESTIONS
  {
    roleKeywords: ['all', 'software', 'full-stack', 'engineer', 'analyst', 'data'],
    category: 'hr',
    topic: 'STAR Method: Conflict Resolution & Collaboration',
    difficulty: 'Intermediate',
    questionText:
      'Tell me about a time when you had a technical disagreement with a teammate or team lead. How did you handle the situation, and what was the outcome?',
    contextOrScenario:
      'Evaluating your communication, empathy, collaborative decision making, and ability to disagree and commit.',
    hints: [
      'Structure your response using STAR: Situation, Task, Action, Result. Focus on objective data and shared project goals rather than ego.',
    ],
    expectedKeyConcepts: [
      'Situation & context description',
      'Objective evaluation of trade-offs',
      'Constructive communication & active listening',
      'Consensus building or Disagree-and-Commit',
      'Measurable positive project outcome',
    ],
    idealAnswerOutline:
      'Set clear Situation & Task regarding conflicting approaches. Describe Action: setting up a benchmark spike, testing performance data together, and discussing user impact constructively. Conclude with Result: delivering on time with team alignment and zero lingering friction.',
  },
  {
    roleKeywords: ['all', 'software', 'full-stack', 'engineer', 'analyst', 'data'],
    category: 'hr',
    topic: 'STAR Method: Handling Critical Deadlines & Pressure',
    difficulty: 'Intermediate',
    questionText:
      'Describe a situation where a project deadline was at risk or priorities unexpectedly shifted. What steps did you take to manage your workload and deliver value?',
    contextOrScenario:
      'Assessing your adaptability, prioritization under pressure, stakeholder transparency, and execution diligence.',
    hints: [
      'Highlight prioritization, scope negotiation, proactive communication, and disciplined execution.',
    ],
    expectedKeyConcepts: [
      'Proactive risk identification',
      'Scope de-scoping (MoSCoW method or MVP focus)',
      'Transparent stakeholder communication',
      'Time management and disciplined delivery',
      'Post-launch retrospectives',
    ],
    idealAnswerOutline:
      'Detail a moment when project scope threatened a deadline. Explain communicating early with stakeholders, reprioritizing the MVP features, putting in focused sprints, and shipping the core functionality with high reliability, followed by a retrospective.',
  },
  {
    roleKeywords: ['all', 'software', 'full-stack', 'engineer', 'analyst', 'data'],
    category: 'hr',
    topic: 'STAR Method: Learning from Failure or Production Mistake',
    difficulty: 'Intermediate',
    questionText:
      'Can you share an experience where a task you were responsible for did not go as planned or a mistake was made? How did you take ownership and what did you learn?',
    contextOrScenario:
      'Assessing accountability, emotional maturity, blameless problem solving, and continuous growth mindset.',
    hints: [
      'Own the responsibility without shifting blame. Emphasize immediate mitigation, root cause analysis, and lasting systemic safeguards.',
    ],
    expectedKeyConcepts: [
      'Direct ownership without deflection',
      'Immediate mitigation and impact containment',
      'Root Cause Analysis (5 Whys)',
      'Systemic safeguard / process improvement implemented',
      'Long-term personal learning',
    ],
    idealAnswerOutline:
      'Recount a real bug or miscalculated timeline. Explain taking immediate ownership to mitigate the issue, performing a blameless post-mortem, and adding automated tests or alerts to ensure the same class of failure could never recur.',
  },
  {
    roleKeywords: ['all', 'software', 'full-stack', 'engineer', 'analyst', 'data'],
    category: 'hr',
    topic: 'Career Goals & Company Motivation',
    difficulty: 'Beginner',
    questionText:
      'Why are you interested in this specific role and domain? How does it align with your long-term career aspirations for the next 2 to 3 years?',
    contextOrScenario:
      'Assessing your intrinsic motivation, career direction, intentionality, and retention potential.',
    hints: [
      'Connect your current skills and past projects to the company mission and domain growth opportunities.',
    ],
    expectedKeyConcepts: [
      'Specific alignment with role responsibilities',
      'Demonstrated understanding of industry domain',
      'Growth roadmap over 2-3 years',
      'Contribution mindset beyond just learning',
    ],
    idealAnswerOutline:
      'Articulate genuine enthusiasm for building impactful systems in this domain. Bridge from foundational academic/project work to mastering scalable architectures, taking on system design ownership, and mentoring incoming peers over the next few years.',
  },
];

export class InterviewQuestionService {
  /**
   * Generates a tailored sequence of interview questions for a session.
   */
  public async generateQuestions(
    input: GenerateQuestionsInput
  ): Promise<IInterviewQuestion[]> {
    const { targetRole, interviewType, difficulty, questionCount, topics = [] } = input;
    const targetCount = Math.max(1, Math.min(10, questionCount));

    // Try dynamic LLM generation first if configured and not simulated
    try {
      if (llmService.getStatus().isConfigured && !llmService.getStatus().isSimulated) {
        const llmQuestions = await this.generateQuestionsWithLlm(input);
        if (llmQuestions && llmQuestions.length >= targetCount) {
          return llmQuestions.slice(0, targetCount);
        }
      }
    } catch (err) {
      logger.warn('[InterviewQuestionService] LLM question generation failed, using curated catalog:', err);
    }

    // Curated catalog fallback
    return this.generateQuestionsFromCatalog(
      targetRole,
      interviewType,
      difficulty,
      targetCount,
      topics
    );
  }

  private generateQuestionsFromCatalog(
    targetRole: string,
    interviewType: InterviewType,
    difficulty: InterviewDifficulty,
    count: number,
    topics: string[]
  ): IInterviewQuestion[] {
    const lowerRole = targetRole.toLowerCase();

    // Filter catalog by category (technical vs hr)
    const categoryMatches = INTERVIEW_QUESTION_CATALOG.filter(
      (q) => q.category === interviewType
    );

    // Score questions based on role keywords and topic relevance
    const scored = categoryMatches.map((q) => {
      let score = 0;
      if (q.difficulty === difficulty) score += 3;
      if (q.roleKeywords.includes('all') || q.roleKeywords.some((k) => lowerRole.includes(k))) {
        score += 4;
      }
      if (topics.length > 0) {
        for (let i = 0; i < topics.length; i++) {
          if (q.topic.toLowerCase().includes(topics[i].toLowerCase())) {
            score += 20 - i * 2;
            break;
          }
        }
      }
      return { question: q, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const selectedCatalog = scored.slice(0, count).map((s) => s.question);

    // If count exceeds catalog matches, cycle through available
    while (selectedCatalog.length < count && categoryMatches.length > 0) {
      selectedCatalog.push(categoryMatches[selectedCatalog.length % categoryMatches.length]);
    }

    return selectedCatalog.map((q, idx) => ({
      _id: new Types.ObjectId(),
      questionIndex: idx,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      questionText: q.questionText,
      contextOrScenario: q.contextOrScenario,
      hints: q.hints,
      expectedKeyConcepts: q.expectedKeyConcepts,
      idealAnswerOutline: q.idealAnswerOutline,
      studentAnswer: '',
    }));
  }

  private async generateQuestionsWithLlm(
    input: GenerateQuestionsInput
  ): Promise<IInterviewQuestion[] | null> {
    const { targetRole, interviewType, difficulty, questionCount, topics = [] } = input;

    const topicConstraint =
      topics.length > 0 ? `Focus on topics: ${topics.join(', ')}.` : '';

    const prompt = `You are a Principal Engineering & Technical Recruiting Lead. Generate ${questionCount} ${interviewType.toUpperCase()} interview questions for a ${targetRole} candidate at the ${difficulty} difficulty level. ${topicConstraint}

CRITICAL RULES:
1. Provide role-relevant questions matching industry standards (Tier-1 software companies).
2. For Technical interviews: focus on architecture, language features, debugging, and trade-offs.
3. For HR interviews: focus on STAR method behavioral competencies (leadership, conflict, failure, deadlines).
4. Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "topic": "Specific Topic Name",
    "questionText": "Detailed question prompt",
    "contextOrScenario": "Real-world context or scenario",
    "hints": ["Helpful hint 1", "Helpful hint 2"],
    "expectedKeyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
    "idealAnswerOutline": "2-3 sentences outlining the ideal high-scoring response"
  }
]`;

    const response = await llmService.generateCompletion(prompt, { temperature: 0.3 });
    const jsonMatch = response.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed.map((item: any, idx: number) => ({
      _id: new Types.ObjectId(),
      questionIndex: idx,
      category: interviewType,
      topic: item.topic || 'Core Competency',
      difficulty,
      questionText: item.questionText,
      contextOrScenario: item.contextOrScenario || '',
      hints: Array.isArray(item.hints) ? item.hints : [],
      expectedKeyConcepts: Array.isArray(item.expectedKeyConcepts) ? item.expectedKeyConcepts : [],
      idealAnswerOutline: item.idealAnswerOutline || '',
      studentAnswer: '',
    }));
  }
}

export const interviewQuestionService = new InterviewQuestionService();
