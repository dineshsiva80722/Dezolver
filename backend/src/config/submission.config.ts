export const submissionConfig = {
  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100
  },

  // Test execution limits
  testExecution: {
    timeLimit: 5, // seconds
    memoryLimit: 256 // MB
  },

  // Workspace execution limits
  workspaceExecution: {
    timeLimit: 10, // seconds
    memoryLimit: 512 // MB
  },

  // Mock execution settings
  mockExecution: {
    processingDelay: 2000, // milliseconds
    timeRange: {
      min: 100,
      max: 500
    },
    memoryRange: {
      min: 10,
      max: 50
    },
    scorePerTestCase: 20
  },

  // Default values
  defaults: {
    initialScore: 0,
    initialTimeUsed: 0,
    initialMemoryUsed: 0,
    mockUserId: 'mock-user',
    mockInputValue: '123'
  },

  // Status messages
  messages: {
    problemNotFound: 'Problem not found',
    submissionNotFound: 'Submission not found',
    accessDenied: 'You do not have access to this problem',
    adminOnly: 'Only admins can rejudge submissions',
    contestSubmissionHidden: "Cannot view other users' submissions during contest",
    invalidLanguage: 'Invalid programming language',
    executionFailed: 'Execution failed',
    invalidInputFormat: 'Invalid input format',
    submissionCreated: 'Submission created and queued for processing',
    submissionQueuedForRejudge: 'Submission queued for rejudging',
    submissionCreatedSuccessfully: 'Submission created successfully',
    languageNotSupported: 'Language not supported in workspace mode',
    compilationError: 'Compilation Error',
    runtimeError: 'Runtime Error',
    runtimeErrorOccurred: 'Runtime error occurred',
    codeExecutedSuccessfully: 'Code executed successfully',
    variablesAssigned: 'Code executed successfully (variables assigned)',
    jsCodeExecuted: 'JavaScript code executed successfully',
    cppCodeExecuted: 'C++ code compiled and executed successfully',
    javaCodeExecuted: 'Java code compiled and executed successfully',
    cCodeExecuted: 'C code compiled and executed successfully',
    pythonExecutionError: 'Python execution error',
    jsExecutionError: 'JavaScript execution error',
    cppExecutionError: 'C++ execution error',
    javaExecutionError: 'Java execution error',
    cExecutionError: 'C execution error'
  },

  // Status codes
  statusCodes: {
    accepted: 'Accepted',
    wrongAnswer: 'wrong_answer',
    internalError: 'internal_error',
    pending: 'pending'
  },

  // Mock test cases for reverse integer problem
  reverseIntegerTestCases: [
    { input: '123', expected: '321' },
    { input: '-123', expected: '-321' },
    { input: '120', expected: '21' },
    { input: '0', expected: '0' },
    { input: '1534236469', expected: '0' } // overflow
  ],

  // Integer overflow bounds
  integerBounds: {
    max: 2147483647,
    min: -2147483648
  },

  // Queue job names
  queueJobs: {
    judgeSubmission: 'judge-submission'
  },

  // Socket events
  socketEvents: {
    submissionCreated: 'submission-created'
  },

  // Mock execution times and memory
  mockExecutionMetrics: {
    time: '0.123',
    memory: 1024
  },

  // Workspace execution random ranges
  workspaceExecutionRanges: {
    time: {
      min: 0.1,
      max: 0.6
    },
    memory: {
      min: 10000,
      max: 60000
    }
  }
};
