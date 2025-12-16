import { logger } from '../utils/logger';

// Mock data for problems when database is not available
export const mockProblems = [
  {
    id: 'reverse-integer',
    slug: 'reverse-integer',
    title: 'Reverse Integer',
    difficulty: 'easy',
    statement: `Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.

**Example 1:**
Input: x = 123
Output: 321

**Example 2:**
Input: x = -123
Output: -321

**Example 3:**
Input: x = 120
Output: 21`,
    input_format: 'A single integer x where -2^31 <= x <= 2^31 - 1',
    output_format: 'Return the reversed integer, or 0 if it overflows.',
    constraints: '-2^31 <= x <= 2^31 - 1',
    examples: [
      { input: '123', output: '321' },
      { input: '-123', output: '-321' },
      { input: '120', output: '21' }
    ],
    tags: ['math', 'integer'],
    is_public: true,
    time_limit: 1000,
    memory_limit: 256,
    created_at: new Date().toISOString(),
    acceptance_rate: 85.5,
    total_submissions: 1250,
    accepted_submissions: 1068
  },
  {
    id: 'two-sum',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    statement:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    input_format: 'First line: array size, Second line: array elements, Third line: target',
    output_format: 'Two space-separated indices',
    constraints: '2 <= nums.length <= 10^4',
    examples: [{ input: '4\n2 7 11 15\n9', output: '0 1' }],
    tags: ['array', 'hash-table'],
    is_public: true,
    time_limit: 1000,
    memory_limit: 256,
    created_at: new Date().toISOString(),
    acceptance_rate: 75.2,
    total_submissions: 2100,
    accepted_submissions: 1579
  },
  {
    id: 'palindrome-number',
    slug: 'palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'easy',
    statement: 'Given an integer x, return true if x is palindrome integer.',
    input_format: 'A single integer x',
    output_format: 'true if palindrome, false otherwise',
    constraints: '-2^31 <= x <= 2^31 - 1',
    examples: [
      { input: '121', output: 'true' },
      { input: '-121', output: 'false' }
    ],
    tags: ['math'],
    is_public: true,
    time_limit: 1000,
    memory_limit: 256,
    created_at: new Date().toISOString(),
    acceptance_rate: 68.4,
    total_submissions: 1800,
    accepted_submissions: 1231
  }
];

// Mock submissions storage
export const mockSubmissions = new Map<string, any>();

export class MockDataService {
  static getProblems() {
    logger.info('Using mock problems data');
    return mockProblems;
  }

  static getProblemBySlug(slug: string) {
    const problem = mockProblems.find((p) => p.slug === slug);
    if (!problem) {
      throw new Error('Problem not found');
    }
    return problem;
  }

  static getProblemById(id: string) {
    const problem = mockProblems.find((p) => p.id === id || p.slug === id);
    if (!problem) {
      throw new Error('Problem not found');
    }
    return problem;
  }

  static createSubmission(data: {
    problemId: string;
    userId: string;
    language: string;
    sourceCode: string;
  }) {
    const submissionId = Date.now().toString();
    const submission = {
      id: submissionId,
      problem_id: data.problemId,
      user_id: data.userId,
      language: data.language,
      source_code: data.sourceCode,
      verdict: 'pending',
      status: 'pending',
      score: 0,
      time_used: 0,
      memory_used: 0,
      submitted_at: new Date().toISOString(),
      created_at: new Date()
    };

    mockSubmissions.set(submissionId, submission);
    logger.info(`Created mock submission ${submissionId}`);
    return submission;
  }

  static getSubmission(id: string) {
    return mockSubmissions.get(id);
  }

  static updateSubmission(id: string, updates: any) {
    const submission = mockSubmissions.get(id);
    if (submission) {
      Object.assign(submission, updates);
      mockSubmissions.set(id, submission);
      logger.info(`Updated mock submission ${id} with verdict: ${updates.verdict}`);
    }
    return submission;
  }

  static getSubmissionsForProblem(problemId: string) {
    return Array.from(mockSubmissions.values())
      .filter((sub) => sub.problem_id === problemId)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }
}

export default MockDataService;
