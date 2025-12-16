import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// First, we need to login as admin
const loginData = {
  email: 'admin@techfolks.com',
  password: 'admin123'
};

const problems = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    statement: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example:
Input:
4
2 7 11 15
9

Output:
0 1

Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`,
    input_format: 'First line contains the number of elements n.\nSecond line contains n space-separated integers.\nThird line contains the target value.',
    output_format: 'Two space-separated integers representing the indices (0-based) of the two numbers.',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    time_limit: 1000,
    memory_limit: 256,
    is_public: true,
    test_cases: [
      { input: '4\n2 7 11 15\n9', expected_output: '0 1', is_sample: true },
      { input: '3\n3 2 4\n6', expected_output: '1 2', is_sample: true },
      { input: '2\n3 3\n6', expected_output: '0 1', is_sample: false },
      { input: '5\n1 2 3 4 5\n9', expected_output: '3 4', is_sample: false },
      { input: '6\n-1 -2 -3 -4 -5 10\n5', expected_output: '4 5', is_sample: false }
    ]
  },
  {
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    difficulty: 'easy',
    statement: `Given an integer x, return true if x is a palindrome, and false otherwise.

An integer is a palindrome when it reads the same forward and backward.

For example, 121 is a palindrome while 123 is not.

Example 1:
Input: 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.

Example 2:
Input: -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.`,
    input_format: 'A single integer x.',
    output_format: 'Print "true" if the number is a palindrome, "false" otherwise.',
    constraints: '-2^31 <= x <= 2^31 - 1',
    time_limit: 1000,
    memory_limit: 256,
    is_public: true,
    test_cases: [
      { input: '121', expected_output: 'true', is_sample: true },
      { input: '-121', expected_output: 'false', is_sample: true },
      { input: '10', expected_output: 'false', is_sample: true },
      { input: '0', expected_output: 'true', is_sample: false },
      { input: '1221', expected_output: 'true', is_sample: false },
      { input: '12321', expected_output: 'true', is_sample: false },
      { input: '123456', expected_output: 'false', is_sample: false }
    ]
  },
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz',
    difficulty: 'easy',
    statement: `Given an integer n, return a list of strings answer where:

- answer[i] == "FizzBuzz" if i is divisible by 3 and 5.
- answer[i] == "Fizz" if i is divisible by 3.
- answer[i] == "Buzz" if i is divisible by 5.
- answer[i] == i (as a string) if none of the above conditions are true.

Print each string on a new line.

Example 1:
Input: 3
Output:
1
2
Fizz

Example 2:
Input: 5
Output:
1
2
Fizz
4
Buzz`,
    input_format: 'A single integer n.',
    output_format: 'n lines, each containing the appropriate FizzBuzz value.',
    constraints: '1 <= n <= 10^4',
    time_limit: 1000,
    memory_limit: 256,
    is_public: true,
    test_cases: [
      { input: '3', expected_output: '1\n2\nFizz', is_sample: true },
      { input: '5', expected_output: '1\n2\nFizz\n4\nBuzz', is_sample: true },
      { input: '15', expected_output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', is_sample: false },
      { input: '1', expected_output: '1', is_sample: false },
      { input: '20', expected_output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz', is_sample: false }
    ]
  }
];

async function addProblems() {
  try {
    // Login first
    console.log('Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData);
    const { accessToken } = loginResponse.data;
    console.log('Login successful!');

    // Set auth header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    // Add each problem
    for (const problem of problems) {
      try {
        console.log(`\nAdding problem: ${problem.title}`);
        
        // Create problem
        const problemResponse = await axios.post(`${API_URL}/problems`, {
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          statement: problem.statement,
          input_format: problem.input_format,
          output_format: problem.output_format,
          constraints: problem.constraints,
          time_limit: problem.time_limit,
          memory_limit: problem.memory_limit,
          is_public: problem.is_public
        });

        const problemId = problemResponse.data.id;
        console.log(`Problem created with ID: ${problemId}`);

        // Add test cases
        for (const testCase of problem.test_cases) {
          await axios.post(`${API_URL}/problems/${problemId}/testcases`, testCase);
        }
        console.log(`Added ${problem.test_cases.length} test cases`);

      } catch (error: any) {
        if (error.response?.status === 409) {
          console.log(`Problem "${problem.title}" already exists, skipping...`);
        } else {
          console.error(`Error adding problem "${problem.title}":`, error.response?.data || error.message);
        }
      }
    }

    console.log('\nAll problems added successfully!');
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

addProblems();