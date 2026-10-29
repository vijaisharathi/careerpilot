import { Types } from 'mongoose';
import {
  AssistantConversation,
  IAssistantConversation,
  IAssistantMessage,
  IRecommendationCard,
} from '../../models/assistantConversation.model';
import { assistantSafetyService } from './assistantSafety.service';
import { assistantContextService, AssistantContextBundle } from './assistantContext.service';
import { llmService } from './llm.service';
import { LlmMessage } from './llm.interface';
import { AppError } from '../../utils/appError';
import { logger } from '../../utils/logger';

export interface SendAssistantMessageInput {
  message: string;
  conversationId?: string;
}

export interface AssistantChatResult {
  conversationId: string;
  message: IAssistantMessage;
  recommendations: IRecommendationCard[];
  suggestedFollowUps: string[];
  contextUsed: string[];
  conversationTitle: string;
}

export class AssistantAiService {
  /**
   * Processes a student chat message with context retrieval, safety inspection,
   * LLM completion, structured recommendations, and conversation persistence.
   */
  public async sendMessage(
    userId: string,
    input: SendAssistantMessageInput
  ): Promise<AssistantChatResult> {
    const userObjectId = new Types.ObjectId(userId);

    // 1. Sanitize & inspect message for safety and prompt injection
    const safetyCheck = assistantSafetyService.sanitizeAndInspect(input.message);
    const sanitizedQuery = safetyCheck.sanitized;

    if (!sanitizedQuery) {
      throw new AppError('Message cannot be empty.', 400);
    }

    // 2. Load or initialize Conversation
    let conversation: IAssistantConversation;
    if (input.conversationId && Types.ObjectId.isValid(input.conversationId)) {
      const existing = await AssistantConversation.findById(input.conversationId);
      if (!existing) {
        throw new AppError('Conversation not found.', 404);
      }
      if (existing.user.toString() !== userId) {
        throw new AppError('You are not authorized to access this conversation.', 403);
      }
      conversation = existing;
    } else {
      // Create new conversation
      const title =
        sanitizedQuery.length > 40
          ? `${sanitizedQuery.slice(0, 37)}...`
          : sanitizedQuery;

      conversation = new AssistantConversation({
        user: userObjectId,
        title,
        messages: [],
      });
    }

    // Record user message
    const userMsg: IAssistantMessage = {
      role: 'user',
      content: sanitizedQuery,
      timestamp: new Date(),
    };
    conversation.messages.push(userMsg);

    // 3. Prompt injection defense
    if (safetyCheck.isSuspicious) {
      logger.warn(`[AssistantAiService] Prompt injection flagged for user ${userId}: ${safetyCheck.reason}`);
      const refusalMsg: IAssistantMessage = {
        role: 'assistant',
        content:
          "I cannot fulfill instructions that attempt to bypass system security rules, reveal internal prompts, or access restricted data. However, I am here to help you with your career goals! Would you like guidance on your target role, skill gaps, or interview practice?",
        recommendations: [
          {
            type: 'career_role',
            title: 'Explore Career Roles',
            description: 'Evaluate supported roles and expected competencies.',
            actionLabel: 'View Roles',
            actionUrl: '/career-analysis',
          },
        ],
        suggestedFollowUps: [
          'What skills do I need for a Full-Stack Developer role?',
          'What are my current skill gaps?',
          'How do I practice for technical interviews?',
        ],
        contextUsed: ['Security Guardrails'],
        isSimulated: false,
        timestamp: new Date(),
      };

      conversation.messages.push(refusalMsg);
      await conversation.save();

      return {
        conversationId: conversation._id.toString(),
        message: refusalMsg,
        recommendations: refusalMsg.recommendations || [],
        suggestedFollowUps: refusalMsg.suggestedFollowUps || [],
        contextUsed: refusalMsg.contextUsed || [],
        conversationTitle: conversation.title,
      };
    }

    // 4. Retrieve contextual facts
    const contextBundle = await assistantContextService.getRelevantContext(userId, sanitizedQuery);

    // 5. Generate Response (Live LLM or Grounded Fallback)
    const assistantOutput = await this.generateAssistantResponse(
      conversation,
      sanitizedQuery,
      contextBundle
    );

    // 6. Record assistant message
    const assistantMsg: IAssistantMessage = {
      role: 'assistant',
      content: assistantOutput.content,
      recommendations: assistantOutput.recommendations,
      suggestedFollowUps: assistantOutput.suggestedFollowUps,
      contextUsed: contextBundle.contextTags,
      isSimulated: assistantOutput.isSimulated,
      timestamp: new Date(),
    };
    conversation.messages.push(assistantMsg);

    // Update conversation title if still default and this was first turn
    if (conversation.title === 'New Career Discussion' && conversation.messages.length <= 3) {
      conversation.title =
        sanitizedQuery.length > 40
          ? `${sanitizedQuery.slice(0, 37)}...`
          : sanitizedQuery;
    }

    await conversation.save();

    return {
      conversationId: conversation._id.toString(),
      message: assistantMsg,
      recommendations: assistantMsg.recommendations || [],
      suggestedFollowUps: assistantMsg.suggestedFollowUps || [],
      contextUsed: contextBundle.contextTags,
      conversationTitle: conversation.title,
    };
  }

  /**
   * Generates conversational response using LLM or grounded domain fallback
   */
  private async generateAssistantResponse(
    conversation: IAssistantConversation,
    userQuery: string,
    context: AssistantContextBundle
  ): Promise<{
    content: string;
    recommendations: IRecommendationCard[];
    suggestedFollowUps: string[];
    isSimulated: boolean;
  }> {
    const aiStatus = llmService.getStatus();

    // Prepare system prompt with context facts
    const contextPrompt = this.formatContextPrompt(context);
    const systemPrompt = `${assistantSafetyService.getSystemPrompt()}\n\nRELEVANT STUDENT & PLATFORM CONTEXT:\n${contextPrompt}`;

    // If live provider is configured (Gemini or OpenAI), try live completion
    if (!aiStatus.isSimulated) {
      try {
        const messages: LlmMessage[] = [
          { role: 'system', content: systemPrompt },
          ...conversation.messages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content })),
        ];

        const completion = await llmService.generateChat(messages, {
          temperature: 0.4,
          maxTokens: 1200,
        });

        if (completion.text && completion.text.trim().length > 10) {
          const recommendations = this.deriveRecommendations(userQuery, context);
          const suggestedFollowUps = this.deriveFollowUps(userQuery, context);

          return {
            content: completion.text.trim(),
            recommendations,
            suggestedFollowUps,
            isSimulated: false,
          };
        }
      } catch (err) {
        logger.warn('[AssistantAiService] Live LLM generation failed, falling back to grounded response:', (err as Error).message);
      }
    }

    // Grounded deterministic synthesizer (handles mock provider and resilient fallbacks)
    return this.generateGroundedResponse(userQuery, context);
  }

  /**
   * Formats retrieved context blocks into clear, grounded prompt sections
   */
  private formatContextPrompt(context: AssistantContextBundle): string {
    const sections: string[] = [];

    if (context.studentSummary) {
      sections.push(`[STUDENT PROFILE]\n${context.studentSummary}`);
    }
    if (context.skillGapsSummary) {
      sections.push(`[CAREER ANALYSIS & SKILL GAPS]\n${context.skillGapsSummary}`);
    }
    if (context.roadmapSummary) {
      sections.push(`[ACTIVE LEARNING ROADMAP]\n${context.roadmapSummary}`);
    }
    if (context.applicationsSummary) {
      sections.push(`[APPLICATION TRACKER]\n${context.applicationsSummary}`);
    }
    if (context.savedJobsSummary) {
      sections.push(`[SAVED JOB OPPORTUNITIES]\n${context.savedJobsSummary}`);
    }
    if (context.resumeSummary) {
      sections.push(`[RESUME ATS ANALYSIS]\n${context.resumeSummary}`);
    }
    if (context.interviewSummary) {
      sections.push(`[INTERVIEW PRACTICE SESSIONS]\n${context.interviewSummary}`);
    }
    if (context.roleCatalogSummary) {
      sections.push(`[OFFICIAL CAREER CATALOG ROLE]\n${context.roleCatalogSummary}`);
    }
    if (context.platformNavigation) {
      sections.push(`[PLATFORM NAVIGATION]\n${context.platformNavigation}`);
    }

    return sections.length > 0 ? sections.join('\n\n') : 'No specific student records found yet.';
  }

  /**
   * High-accuracy, grounded response synthesizer providing tailored career answers
   */
  private generateGroundedResponse(
    query: string,
    context: AssistantContextBundle
  ): {
    content: string;
    recommendations: IRecommendationCard[];
    suggestedFollowUps: string[];
    isSimulated: boolean;
  } {
    const qLower = query.toLowerCase();
    const recommendations: IRecommendationCard[] = this.deriveRecommendations(query, context);
    const suggestedFollowUps: string[] = this.deriveFollowUps(query, context);

    let content = '';

    // Intent 1: Platform Navigation & Feature Locations (check early for "where", "how do i find", etc.)
    const isNavRelated =
      qLower.includes('where') ||
      qLower.includes('how do i find') ||
      qLower.includes('how can i find') ||
      qLower.includes('navigate') ||
      qLower.includes('which page') ||
      qLower.includes('what page');

    if (isNavRelated) {
      if (qLower.includes('interview') || qLower.includes('prep') || qLower.includes('mock')) {
        content =
          `You can practice technical and HR mock interviews on the AI Interview Prep page at: /interview-prep\n\n` +
          `There you can configure target roles, choose difficulty levels (Beginner, Intermediate, Advanced), submit answers, and receive instant rubric evaluations with feedback.`;
      } else if (qLower.includes('resume') || qLower.includes('ats')) {
        content =
          `You can design and export resumes on the Resume Builder page (/resume-builder) or upload your PDF/DOCX resume for ATS matching on the Resume Analyzer page (/resume-analysis).`;
      } else if (qLower.includes('roadmap') || qLower.includes('curriculum')) {
        content =
          `You can view and manage your personalized curriculum on the Learning Roadmap page at: /roadmap`;
      } else if (qLower.includes('job') || qLower.includes('internship') || qLower.includes('vacancy')) {
        content =
          `You can discover and match with opportunities on the Job Discovery page at: /jobs`;
      } else if (qLower.includes('application') || qLower.includes('tracker')) {
        content =
          `You can organize and track your recruitment pipeline on the Application Tracker board at: /applications`;
      } else {
        content =
          `Here is a quick guide to navigating Career Pilot AI:\n\n` +
          `${context.platformNavigation || 'Navigate using the sidebar navigation menu to access Dashboard, Profile, Career Analysis, Learning Roadmap, Jobs, Resume Builder, Interview Prep, and Applications.'}`;
      }
    }
    // Intent 2: Skill Gaps & Readiness
    else if (
      qLower.includes('skill') ||
      qLower.includes('gap') ||
      qLower.includes('strength') ||
      qLower.includes('improve') ||
      qLower.includes('readiness')
    ) {
      if (context.skillGapsSummary) {
        content =
          `Here is an assessment of your skills and career readiness based on your latest analysis:\n\n` +
          `${context.skillGapsSummary}\n\n` +
          `Key Recommendations:\n` +
          `1. Prioritize critical missing skills first before applying for high-volume recruitment drives.\n` +
          `2. Work through hands-on coding milestones rather than passive video tutorials.\n` +
          `3. Target projects that demonstrate production concerns such as caching, error handling, and unit testing.`;
      } else {
        content =
          `I noticed you haven't run a Career Analysis yet! When you run a career analysis, we compare your current technical skills against verified industry job descriptions to identify exact skill gaps and calculate your readiness score.\n\n` +
          `You can navigate to the Career Analysis page to run an assessment for your target role.`;
      }
    }
    // Intent 2: Learning Roadmap
    else if (
      qLower.includes('roadmap') ||
      qLower.includes('learn') ||
      qLower.includes('study') ||
      qLower.includes('course') ||
      qLower.includes('plan')
    ) {
      if (context.roadmapSummary) {
        content =
          `Here is the current status of your Personalized Learning Roadmap:\n\n` +
          `${context.roadmapSummary}\n\n` +
          `Learning Strategy Advice:\n` +
          `- Stay consistent with your weekly study allocation.\n` +
          `- Complete the upcoming practical exercises and mark them off in your roadmap to advance your curriculum progress.`;
      } else {
        content =
          `You do not have an active learning roadmap generated yet. A roadmap organizes your missing skills into phased, weekly curriculum modules with curated exercises and practical projects.\n\n` +
          `Head over to the Learning Roadmap page to generate your personalized plan.`;
      }
    }
    // Intent 3: Job Applications & Pipeline
    else if (
      qLower.includes('application') ||
      qLower.includes('interview') ||
      qLower.includes('status') ||
      qLower.includes('tracker') ||
      qLower.includes('follow up')
    ) {
      if (context.applicationsSummary) {
        content =
          `Here is the latest snapshot from your Application Tracker:\n\n` +
          `${context.applicationsSummary}\n\n` +
          `Placement Pipeline Advice:\n` +
          `- Ensure you prepare role-specific STAR behavioral answers for any upcoming technical or HR screens.\n` +
          `- Keep your follow-up dates updated after each recruiter correspondence.`;
      } else {
        content =
          `You currently don't have any job or internship applications tracked in your placement pipeline. You can add positions manually or click "Apply Now" on any job in Job Discovery to track it automatically.`;
      }
    }
    // Intent 4: Resume Review & ATS Recommendations
    else if (
      qLower.includes('resume') ||
      qLower.includes('cv') ||
      qLower.includes('ats') ||
      qLower.includes('bullet')
    ) {
      if (context.resumeSummary) {
        content =
          `Here are the highlights from your latest Resume ATS Analysis:\n\n` +
          `${context.resumeSummary}\n\n` +
          `ATS Optimization Tips:\n` +
          `- Use standard section headings (Education, Technical Skills, Experience, Projects).\n` +
          `- Format bullets with the Google XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]".\n` +
          `- Integrate high-frequency job keywords naturally into your project descriptions.`;
      } else {
        content =
          `To get a detailed ATS score, missing keyword breakdown, and bullet point recommendations, upload your PDF or DOCX resume to the Resume Analyzer module. You can also build clean, print-friendly resumes directly using our Resume Builder.`;
      }
    }
    // Intent 5: Specific Career Role Requirements
    else if (context.roleCatalogSummary) {
      content =
        `Here are the verified expectations and market data for this role:\n\n` +
        `${context.roleCatalogSummary}\n\n` +
        `Next Step: Run a Career Analysis for this role to see how your current coursework and projects compare!`;
    }
    // Intent 6: Platform Navigation
    else if (
      qLower.includes('where') ||
      qLower.includes('how do i') ||
      qLower.includes('navigate') ||
      qLower.includes('find')
    ) {
      content =
        `Here is a quick guide to navigating Career Pilot AI:\n\n` +
        `${context.platformNavigation || 'Navigate using the sidebar navigation menu to access Dashboard, Profile, Career Analysis, Learning Roadmap, Jobs, Resume Builder, Interview Prep, and Applications.'}`;
    }
    // Default Intent: Broad Career Guidance
    else {
      const studentName = context.studentSummary ? context.studentSummary.split('\n')[0].replace('Student: ', '') : 'there';
      content =
        `Hello ${studentName}! I am your AI Career Assistant.\n\n` +
        `I can help you with:\n` +
        `1. Evaluating career roles (e.g., Full-Stack, Backend, Cloud & DevOps, Data Scientist)\n` +
        `2. Identifying skill gaps and explaining your career readiness scores\n` +
        `3. Planning weekly learning tasks from your personalized roadmap\n` +
        `4. Reviewing resume keywords and bullet point improvements\n` +
        `5. Preparing for technical and behavioral placement interviews\n` +
        `6. Tracking job applications and scheduled recruiter screens\n\n` +
        `What specific area would you like to explore?`;
    }

    return {
      content,
      recommendations,
      suggestedFollowUps,
      isSimulated: true,
    };
  }

  /**
   * Derives smart structured recommendation cards based on query and context
   */
  private deriveRecommendations(
    query: string,
    _context: AssistantContextBundle
  ): IRecommendationCard[] {
    const qLower = query.toLowerCase();
    const cards: IRecommendationCard[] = [];

    if (
      qLower.includes('skill') ||
      qLower.includes('gap') ||
      qLower.includes('analysis') ||
      qLower.includes('match')
    ) {
      cards.push({
        type: 'skill_gap',
        title: 'Review Skill Gap Breakdown',
        description: 'See detailed proficiency requirements and missing competencies.',
        actionLabel: 'Open Skill Gaps',
        actionUrl: '/skill-gap',
      });
      cards.push({
        type: 'roadmap_phase',
        title: 'Build Learning Roadmap',
        description: 'Bridge identified skill gaps with structured weekly modules.',
        actionLabel: 'Generate Roadmap',
        actionUrl: '/roadmap',
      });
    } else if (
      qLower.includes('interview') ||
      qLower.includes('prep') ||
      qLower.includes('star') ||
      qLower.includes('dsa')
    ) {
      cards.push({
        type: 'interview_prep',
        title: 'Start AI Mock Interview',
        description: 'Practice role-relevant technical and HR screening questions.',
        actionLabel: 'Start Practice Session',
        actionUrl: '/interview-prep',
      });
    } else if (qLower.includes('resume') || qLower.includes('cv') || qLower.includes('ats')) {
      cards.push({
        type: 'resume_tip',
        title: 'Resume ATS Review',
        description: 'Analyze keyword match and get criteria-based bullet feedback.',
        actionLabel: 'Analyze Resume',
        actionUrl: '/resume-analysis',
      });
      cards.push({
        type: 'resume_tip',
        title: 'Resume Builder',
        description: 'Format and export professional PDF resumes.',
        actionLabel: 'Open Resume Builder',
        actionUrl: '/resume-builder',
      });
    } else if (qLower.includes('job') || qLower.includes('apply') || qLower.includes('tracker')) {
      cards.push({
        type: 'job_listing',
        title: 'Discover Job Opportunities',
        description: 'Browse campus and verified internship listings.',
        actionLabel: 'Search Opportunities',
        actionUrl: '/jobs',
      });
      cards.push({
        type: 'platform_nav',
        title: 'Application Tracker',
        description: 'Manage placement pipeline stages on Kanban board.',
        actionLabel: 'View Applications',
        actionUrl: '/applications',
      });
    } else {
      cards.push({
        type: 'career_role',
        title: 'Career Role Catalog',
        description: 'Explore career paths, salary benchmarks, and demand.',
        actionLabel: 'Explore Roles',
        actionUrl: '/career-analysis',
      });
    }

    return cards.slice(0, 2);
  }

  /**
   * Generates dynamic contextual follow-up questions
   */
  private deriveFollowUps(query: string, _context: AssistantContextBundle): string[] {
    const qLower = query.toLowerCase();

    if (qLower.includes('skill') || qLower.includes('gap')) {
      return [
        'How can I bridge my critical missing skills in 4 weeks?',
        'Which certifications are most respected for this role?',
        'Can you recommend a hands-on portfolio project for my missing skills?',
      ];
    }

    if (qLower.includes('interview') || qLower.includes('prep')) {
      return [
        'How should I structure a STAR behavioral answer about leadership?',
        'What are high-frequency system design questions for new grads?',
        'Can we practice a mock technical question right now?',
      ];
    }

    if (qLower.includes('resume') || qLower.includes('ats')) {
      return [
        'How can I make my project bullet points more quantifiable?',
        'What are the most critical keywords for a Full-Stack Developer resume?',
        'Should I include coursework or GPA on my resume?',
      ];
    }

    if (qLower.includes('application') || qLower.includes('job')) {
      return [
        'What should I say in a recruiter follow-up email after 7 days?',
        'How can I prepare for an upcoming coding assessment (OA)?',
        'Which opportunities in Job Discovery have the highest match score?',
      ];
    }

    return [
      'What are the key requirements for a Full-Stack Developer?',
      'How do I bridge my current skill gaps with a learning roadmap?',
      'How should I prepare for technical interviews this placement season?',
    ];
  }

  /**
   * Lists all conversations for a student
   */
  public async getConversations(userId: string): Promise<Array<{
    _id: string;
    title: string;
    messageCount: number;
    lastMessageSnippet: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    const list = await AssistantConversation.find({
      user: new Types.ObjectId(userId),
    })
      .sort({ updatedAt: -1 })
      .lean();

    return list.map((c) => {
      const lastMsg = c.messages[c.messages.length - 1];
      const snippet = lastMsg ? lastMsg.content.slice(0, 80) : '';

      return {
        _id: c._id.toString(),
        id: c._id.toString(),
        title: c.title,
        messageCount: c.messages.length,
        lastMessageSnippet: snippet,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });
  }

  /**
   * Retrieves a single conversation by ID with student ownership enforcement
   */
  public async getConversationById(
    userId: string,
    conversationId: string
  ): Promise<IAssistantConversation> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new AppError('Invalid conversation ID format.', 400);
    }

    const conversation = await AssistantConversation.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found.', 404);
    }

    if (conversation.user.toString() !== userId) {
      throw new AppError('You are not authorized to view this conversation.', 403);
    }

    return conversation;
  }

  /**
   * Deletes a single conversation ensuring student ownership
   */
  public async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.getConversationById(userId, conversationId);
    await conversation.deleteOne();
  }

  /**
   * Clears all conversations for the student
   */
  public async clearAllConversations(userId: string): Promise<void> {
    await AssistantConversation.deleteMany({
      user: new Types.ObjectId(userId),
    });
  }
}

export const assistantAiService = new AssistantAiService();
