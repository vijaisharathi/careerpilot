import { Types } from 'mongoose';
import {
  CodingQuestion,
  ICodingQuestion,
  SupportedLanguage,
  CodingDifficulty,
  ISampleTestCase,
  IPrivateTestCase,
} from '../models/codingQuestion.model';
import { AuditLog } from '../models/auditLog.model';

export class CodingQuestionService {
  /**
   * Sanitizes a question document for student viewing by stripping all private evaluation test cases.
   */
  public sanitizeForStudent(question: ICodingQuestion | any): Record<string, any> {
    const raw = typeof question.toObject === 'function' ? question.toObject() : { ...question };
    delete raw.privateTestCases;
    // Don't show editorial to student during active practice unless unlocked
    delete raw.editorial;
    return raw;
  }

  /**
   * Validates question metadata and test case specifications before creation or publication.
   */
  public validateQuestionData(data: {
    title: string;
    description: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    sampleTestCases?: ISampleTestCase[];
    privateTestCases?: IPrivateTestCase[];
  }): void {
    if (!data.title?.trim()) {
      throw new Error('Question title is required and cannot be empty.');
    }
    if (!data.description?.trim()) {
      throw new Error('Problem description is required.');
    }
    if (!data.inputFormat?.trim() || !data.outputFormat?.trim()) {
      throw new Error('Both input format and output format specifications are required.');
    }
    if (!data.constraints?.trim()) {
      throw new Error('Problem constraints must be specified.');
    }
    if (!data.sampleTestCases || data.sampleTestCases.length === 0) {
      throw new Error('At least one public sample test case is required.');
    }
    if (!data.privateTestCases || data.privateTestCases.length === 0) {
      throw new Error('At least one private evaluation test case is required.');
    }
  }

  /**
   * Retrieves active coding questions for students with filtering and pagination.
   */
  public async getQuestionsForStudents(query?: {
    category?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    questions: Array<Record<string, any>>;
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const filter: Record<string, any> = { status: 'active' };

    if (query?.category && query.category !== 'all') {
      filter.category = query.category;
    }
    if (query?.difficulty && query.difficulty !== 'all') {
      filter.difficulty = query.difficulty;
    }
    if (query?.search?.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: regex }, { topicTags: regex }];
    }

    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(50, Math.max(1, query?.limit || 12));
    const skip = (page - 1) * limit;

    const [questions, totalCount] = await Promise.all([
      CodingQuestion.find(filter)
        .select('-privateTestCases -editorial')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CodingQuestion.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      questions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves a single question by ID or slug for a student (private test cases stripped).
   */
  public async getQuestionByIdOrSlug(idOrSlug: string): Promise<Record<string, any>> {
    let question: ICodingQuestion | null = null;

    if (Types.ObjectId.isValid(idOrSlug)) {
      question = await CodingQuestion.findById(idOrSlug);
    }
    if (!question) {
      question = await CodingQuestion.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!question || question.status === 'archived') {
      throw new Error('Coding question not found or is no longer active.');
    }

    return this.sanitizeForStudent(question);
  }

  /**
   * Internal retrieval for execution engine (includes private test cases).
   */
  public async getQuestionWithTestCases(questionId: string | Types.ObjectId): Promise<ICodingQuestion> {
    const question = await CodingQuestion.findById(questionId);
    if (!question || question.status === 'archived') {
      throw new Error('Coding question not found or is archived.');
    }
    return question;
  }

  /**
   * Admin: Creates a new coding question.
   */
  public async createQuestion(
    actor: { id: string; email: string; name: string; role: string },
    payload: Partial<ICodingQuestion>
  ): Promise<ICodingQuestion> {
    this.validateQuestionData(payload as any);

    const baseSlug = (payload.title || 'problem')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let count = 1;
    while (await CodingQuestion.exists({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const question = new CodingQuestion({
      ...payload,
      slug,
      createdBy: new Types.ObjectId(actor.id),
    });

    await question.save();

    await AuditLog.create({
      eventType: 'coding_question_created',
      actorId: new Types.ObjectId(actor.id),
      actorEmail: actor.email,
      actorName: actor.name,
      targetId: question._id.toString(),
      targetType: 'CodingQuestion',
      action: `Created coding question: ${question.title} (${question.difficulty})`,
      status: 'success',
      metadata: { difficulty: question.difficulty, category: question.category },
      createdAt: new Date(),
    });

    return question;
  }

  /**
   * Admin: Updates an existing question.
   */
  public async updateQuestion(
    actor: { id: string; email: string; name: string },
    questionId: string,
    payload: Partial<ICodingQuestion>
  ): Promise<ICodingQuestion> {
    const question = await CodingQuestion.findById(questionId);
    if (!question) {
      throw new Error('Question not found.');
    }

    Object.assign(question, payload);
    await question.save();

    await AuditLog.create({
      eventType: 'coding_question_updated',
      actorId: new Types.ObjectId(actor.id),
      actorEmail: actor.email,
      actorName: actor.name,
      targetId: question._id.toString(),
      targetType: 'CodingQuestion',
      action: `Updated coding question: ${question.title}`,
      status: 'success',
      createdAt: new Date(),
    });

    return question;
  }

  /**
   * Seeds foundational questions across curriculum categories if the database is empty.
   */
  public async seedInitialQuestionsIfEmpty(): Promise<void> {
    const count = await CodingQuestion.countDocuments();
    if (count > 0) return;

    const initialQuestions = [
      {
        title: 'Two Sum Problem',
        slug: 'two-sum-problem',
        description:
          'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
        inputFormat: 'Line 1: Space-separated integers representing nums\nLine 2: Single integer target',
        outputFormat: 'Space-separated pair of 0-based indices [index1 index2]',
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
        difficulty: 'Easy' as CodingDifficulty,
        category: 'Arrays & Strings',
        topicTags: ['arrays', 'hash-map', 'two-pointers'],
        supportedLanguages: ['python', 'javascript', 'java', 'cpp'] as SupportedLanguage[],
        starterCode: {
          python: 'def two_sum(nums, target):\n    # Write your solution here\n    pass\n',
          javascript: 'function twoSum(nums, target) {\n    // Write your solution here\n}\n',
          java: 'public class Solution {\n    public static int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}\n',
          cpp: '#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n}\n',
        },
        sampleTestCases: [
          {
            input: '2 7 11 15\n9',
            output: '0 1',
            explanation: 'nums[0] + nums[1] = 2 + 7 = 9, so indices are 0 and 1.',
          },
        ],
        privateTestCases: [
          {
            input: '3 2 4\n6',
            output: '1 2',
            weight: 1,
            isHidden: true,
          },
          {
            input: '3 3\n6',
            output: '0 1',
            weight: 1,
            isHidden: true,
          },
        ],
        hints: ['Try using a hash table to check if target - num exists.'],
        editorial: 'A hash map lookup takes O(1) time on average, giving an overall O(N) solution.',
        expectedOutcomes: ['Understand hash table lookups', 'Optimize from O(N^2) to O(N)'],
        status: 'active' as const,
      },
      {
        title: 'Valid Palindrome Verification',
        slug: 'valid-palindrome-verification',
        description:
          'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
        inputFormat: 'Single string line containing candidate text',
        outputFormat: 'true or false',
        constraints: '1 <= s.length <= 2 * 10^5',
        difficulty: 'Easy' as CodingDifficulty,
        category: 'Programming Fundamentals',
        topicTags: ['strings', 'two-pointers'],
        supportedLanguages: ['python', 'javascript', 'java', 'cpp'] as SupportedLanguage[],
        starterCode: {
          python: 'def is_palindrome(s: str) -> bool:\n    pass\n',
          javascript: 'function isPalindrome(s) {\n    return false;\n}\n',
          java: 'public class Solution {\n    public boolean isPalindrome(String s) {\n        return false;\n    }\n}\n',
          cpp: 'bool isPalindrome(string s) {\n    return false;\n}\n',
        },
        sampleTestCases: [
          {
            input: 'A man, a plan, a canal: Panama',
            output: 'true',
            explanation: '"amanaplanacanalpanama" is a valid palindrome.',
          },
        ],
        privateTestCases: [
          {
            input: 'race a car',
            output: 'false',
            weight: 1,
            isHidden: true,
          },
          {
            input: ' ',
            output: 'true',
            weight: 1,
            isHidden: true,
          },
        ],
        hints: ['Use two pointers moving from outside inwards while skipping non-alphanumeric characters.'],
        editorial: 'O(N) time with O(1) extra space using two pointers.',
        expectedOutcomes: ['Character classification', 'Two-pointer manipulation'],
        status: 'active' as const,
      },
      {
        title: 'Binary Search Implementation',
        slug: 'binary-search-implementation',
        description:
          'Given an array of integers `nums` sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return -1.',
        inputFormat: 'Line 1: Sorted space-separated integers\nLine 2: Target integer',
        outputFormat: '0-based index of target or -1',
        constraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4',
        difficulty: 'Easy' as CodingDifficulty,
        category: 'Searching & Sorting',
        topicTags: ['binary-search', 'algorithms'],
        supportedLanguages: ['python', 'javascript', 'java', 'cpp'] as SupportedLanguage[],
        starterCode: {
          python: 'def search(nums, target):\n    pass\n',
          javascript: 'function search(nums, target) {\n    return -1;\n}\n',
          java: 'public class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}\n',
          cpp: 'int search(vector<int>& nums, int target) {\n    return -1;\n}\n',
        },
        sampleTestCases: [
          {
            input: '-1 0 3 5 9 12\n9',
            output: '4',
            explanation: '9 exists in nums and its index is 4',
          },
        ],
        privateTestCases: [
          {
            input: '-1 0 3 5 9 12\n2',
            output: '-1',
            weight: 1,
            isHidden: true,
          },
        ],
        hints: ['Divide the search interval in half every step: mid = low + (high - low) // 2.'],
        editorial: 'O(log N) runtime with O(1) space.',
        expectedOutcomes: ['Logarithmic search complexity', 'Boundary condition mastery'],
        status: 'active' as const,
      },
      {
        title: 'Fibonacci Number Calculation',
        slug: 'fibonacci-number-calculation',
        description:
          'The Fibonacci numbers, commonly denoted `F(n)` form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.',
        inputFormat: 'Single non-negative integer n',
        outputFormat: 'Value of F(n)',
        constraints: '0 <= n <= 30',
        difficulty: 'Easy' as CodingDifficulty,
        category: 'Recursion',
        topicTags: ['recursion', 'dynamic-programming'],
        supportedLanguages: ['python', 'javascript', 'java', 'cpp'] as SupportedLanguage[],
        starterCode: {
          python: 'def fib(n: int) -> int:\n    pass\n',
          javascript: 'function fib(n) {\n    return 0;\n}\n',
          java: 'public class Solution {\n    public int fib(int n) {\n        return 0;\n    }\n}\n',
          cpp: 'int fib(int n) {\n    return 0;\n}\n',
        },
        sampleTestCases: [
          { input: '2', output: '1', explanation: 'F(2) = F(1) + F(0) = 1 + 0 = 1.' },
          { input: '3', output: '2', explanation: 'F(3) = F(2) + F(1) = 1 + 1 = 2.' },
        ],
        privateTestCases: [
          { input: '4', output: '3', weight: 1, isHidden: true },
          { input: '10', output: '55', weight: 1, isHidden: true },
        ],
        hints: ['Base cases are F(0) = 0 and F(1) = 1.'],
        editorial: 'Iterative approach takes O(N) time and O(1) space.',
        expectedOutcomes: ['Understanding recurrence relations'],
        status: 'active' as const,
      },
      {
        title: 'Maximum Subarray Sum (Kadane)',
        slug: 'maximum-subarray-sum-kadane',
        description:
          'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.',
        inputFormat: 'Single line of space-separated integers',
        outputFormat: 'Single integer representing maximum contiguous sum',
        constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
        difficulty: 'Medium' as CodingDifficulty,
        category: 'Algorithms',
        topicTags: ['dynamic-programming', 'arrays'],
        supportedLanguages: ['python', 'javascript', 'java', 'cpp'] as SupportedLanguage[],
        starterCode: {
          python: 'def max_sub_array(nums):\n    pass\n',
          javascript: 'function maxSubArray(nums) {\n    return 0;\n}\n',
          java: 'public class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}\n',
          cpp: 'int maxSubArray(vector<int>& nums) {\n    return 0;\n}\n',
        },
        sampleTestCases: [
          {
            input: '-2 1 -3 4 -1 2 1 -5 4',
            output: '6',
            explanation: 'Subarray [4, -1, 2, 1] has the largest sum 6.',
          },
        ],
        privateTestCases: [
          { input: '1', output: '1', weight: 1, isHidden: true },
          { input: '5 4 -1 7 8', output: '23', weight: 1, isHidden: true },
        ],
        hints: ['Keep track of current running sum; reset to current element if running sum becomes negative.'],
        editorial: 'Kadane algorithm achieves optimal O(N) runtime.',
        expectedOutcomes: ['Greedy/DP optimization'],
        status: 'active' as const,
      },
    ];

    await CodingQuestion.insertMany(initialQuestions);
  }
}

export const codingQuestionService = new CodingQuestionService();

