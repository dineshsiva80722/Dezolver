const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock submission queue
const mockSubmissions = new Map();

// Mock submission endpoint
app.post('/api/problems/:id/submit', (req, res) => {
  const { id: problemId } = req.params;
  const { code, language } = req.body;
  
  console.log(`Received submission for problem ${problemId}`);
  console.log(`Language: ${language}`);
  console.log(`Code length: ${code?.length || 0} characters`);
  
  // Create mock submission
  const submissionId = Date.now().toString();
  const submission = {
    id: submissionId,
    problem_id: problemId,
    language,
    source_code: code,
    verdict: 'pending',
    status: 'pending',
    submitted_at: new Date().toISOString(),
    score: 0,
    time_used: 0,
    memory_used: 0
  };
  
  mockSubmissions.set(submissionId, submission);
  
  // Simulate processing after a delay
  setTimeout(async () => {
    try {
      console.log(`Processing submission ${submissionId} for reverse integer`);
      
      // Mock reverse integer test cases
      const testCases = [
        { input: '123', expected: '321' },
        { input: '-123', expected: '-321' },
        { input: '120', expected: '21' },
        { input: '0', expected: '0' },
        { input: '1534236469', expected: '0' }, // overflow
      ];
      
      let allPassed = true;
      let totalScore = 0;
      
      for (const testCase of testCases) {
        const input = parseInt(testCase.input);
        let result = 0;
        let x = Math.abs(input);
        
        while (x !== 0) {
          result = result * 10 + x % 10;
          x = Math.floor(x / 10);
        }
        
        result = input < 0 ? -result : result;
        
        // Handle 32-bit overflow
        if (result > 2147483647 || result < -2147483648) {
          result = 0;
        }
        
        const actualOutput = result.toString();
        const expectedOutput = testCase.expected;
        
        console.log(`Test case: ${testCase.input} -> Expected: ${expectedOutput}, Got: ${actualOutput}`);
        
        if (actualOutput === expectedOutput) {
          totalScore += 20;
        } else {
          allPassed = false;
          break;
        }
      }
      
      // Update submission
      submission.verdict = allPassed ? 'accepted' : 'wrong_answer';
      submission.status = allPassed ? 'accepted' : 'wrong_answer';
      submission.score = totalScore;
      submission.time_used = Math.floor(Math.random() * 500) + 100; // Random time
      submission.memory_used = Math.floor(Math.random() * 50) + 10; // Random memory
      
      console.log(`Submission ${submissionId} completed with verdict: ${submission.verdict}`);
      
    } catch (error) {
      console.error(`Error processing submission ${submissionId}:`, error);
      submission.verdict = 'internal_error';
      submission.status = 'internal_error';
    }
  }, 2000); // 2 second delay
  
  res.status(201).json({
    success: true,
    data: submission,
    message: 'Submission created successfully'
  });
});

// Mock code run endpoint  
app.post('/api/submissions/run', (req, res) => {
  const { source_code, language, input } = req.body;
  
  console.log(`Running code: ${language}`);
  
  // Mock reverse integer execution
  try {
    const num = parseInt(input || '123');
    let result = 0;
    let x = Math.abs(num);
    
    while (x !== 0) {
      result = result * 10 + x % 10;
      x = Math.floor(x / 10);
    }
    
    result = num < 0 ? -result : result;
    
    if (result > 2147483647 || result < -2147483648) {
      result = 0;
    }
    
    res.json({
      success: true,
      output: result.toString(),
      stdout: result.toString(),
      error: null,
      stderr: null,
      compile_output: null,
      status: 'Accepted',
      time: '0.123',
      memory: 1024
    });
  } catch (error) {
    res.json({
      success: false,
      error: 'Execution failed',
      stderr: error.message
    });
  }
});

// Mock problems endpoint
app.get('/api/problems', (req, res) => {
  const mockProblems = [
    {
      id: 'reverse-integer',
      slug: 'reverse-integer',
      title: 'Reverse Integer',
      difficulty: 'easy',
      statement: 'Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.',
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
      created_at: new Date().toISOString()
    },
    {
      id: 'two-sum',
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'easy',
      statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      input_format: 'First line: array size, Second line: array elements, Third line: target',
      output_format: 'Two space-separated indices',
      constraints: '2 <= nums.length <= 10^4',
      examples: [
        { input: '4\n2 7 11 15\n9', output: '0 1' }
      ],
      tags: ['array', 'hash-table'],
      is_public: true,
      time_limit: 1000,
      memory_limit: 256,
      created_at: new Date().toISOString()
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
      created_at: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: mockProblems,
    pagination: {
      page: 1,
      limit: 20,
      total: mockProblems.length,
      totalPages: 1
    }
  });
});

// Mock problem detail endpoint
app.get('/api/problems/:slug', (req, res) => {
  const { slug } = req.params;
  
  const problems = {
    'reverse-integer': {
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
    }
  };
  
  const problem = problems[slug];
  if (!problem) {
    return res.status(404).json({
      success: false,
      message: 'Problem not found'
    });
  }
  
  res.json({
    success: true,
    data: problem
  });
});

// Mock problem submissions endpoint
app.get('/api/problems/:id/submissions', (req, res) => {
  const submissions = Array.from(mockSubmissions.values())
    .filter(sub => sub.problem_id === req.params.id)
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    
  res.json({
    success: true,
    data: submissions,
    pagination: {
      page: 1,
      limit: 20, 
      total: submissions.length,
      totalPages: Math.ceil(submissions.length / 20)
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock server running' });
});

// Get submission status
app.get('/api/submissions/:id/status', (req, res) => {
  const { id } = req.params;
  const submission = mockSubmissions.get(id);
  
  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }
  
  res.json({
    success: true,
    data: {
      id: submission.id,
      verdict: submission.verdict,
      score: submission.score,
      time_used: submission.time_used,
      memory_used: submission.memory_used
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});