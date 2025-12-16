import { AppDataSource } from '../src/config/database';
import { Problem, ProblemDifficulty } from '../src/models/Problem.entity';
import { TestCase } from '../src/models/TestCase.entity';

const problems = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: ProblemDifficulty.EASY,
    statement: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    input_format: 'First line contains the number of elements n.\nSecond line contains n space-separated integers.\nThird line contains the target value.',
    output_format: 'Two space-separated integers representing the indices (0-based) of the two numbers.',
    examples: [
      {
        input: '4\n2 7 11 15\n9',
        output: '0 1',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      }
    ],
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isPublic: true },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', isPublic: true },
      { input: '2\n3 3\n6', expectedOutput: '0 1', isPublic: false },
      { input: '5\n1 2 3 4 5\n9', expectedOutput: '3 4', isPublic: false },
      { input: '6\n-1 -2 -3 -4 -5 10\n5', expectedOutput: '4 5', isPublic: false }
    ],
    time_limit: 1000,
    memory_limit: 256
  },
  {
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    difficulty: ProblemDifficulty.EASY,
    statement: `Given an integer x, return true if x is a palindrome, and false otherwise.

An integer is a palindrome when it reads the same forward and backward.

For example, 121 is a palindrome while 123 is not.`,
    constraints: '-2^31 <= x <= 2^31 - 1',
    input_format: 'A single integer x.',
    output_format: 'Print "true" if the number is a palindrome, "false" otherwise.',
    examples: [
      {
        input: '121',
        output: 'true',
        explanation: '121 reads as 121 from left to right and from right to left.'
      },
      {
        input: '-121',
        output: 'false',
        explanation: 'From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.'
      }
    ],
    testCases: [
      { input: '121', expectedOutput: 'true', isPublic: true },
      { input: '-121', expectedOutput: 'false', isPublic: true },
      { input: '10', expectedOutput: 'false', isPublic: true },
      { input: '0', expectedOutput: 'true', isPublic: false },
      { input: '1221', expectedOutput: 'true', isPublic: false },
      { input: '12321', expectedOutput: 'true', isPublic: false },
      { input: '123456', expectedOutput: 'false', isPublic: false }
    ],
    time_limit: 1000,
    memory_limit: 256
  },
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz',
    difficulty: ProblemDifficulty.EASY,
    statement: `Given an integer n, return a list of strings answer where:

- answer[i] == "FizzBuzz" if i is divisible by 3 and 5.
- answer[i] == "Fizz" if i is divisible by 3.
- answer[i] == "Buzz" if i is divisible by 5.
- answer[i] == i (as a string) if none of the above conditions are true.

Print each string on a new line.`,
    constraints: '1 <= n <= 10^4',
    input_format: 'A single integer n.',
    output_format: 'n lines, each containing the appropriate FizzBuzz value.',
    examples: [
      {
        input: '3',
        output: '1\n2\nFizz',
        explanation: 'For n=3: 1 is not divisible by 3 or 5, 2 is not divisible by 3 or 5, 3 is divisible by 3.'
      },
      {
        input: '5',
        output: '1\n2\nFizz\n4\nBuzz',
        explanation: 'For n=5: 1, 2, 4 are not divisible by 3 or 5. 3 is divisible by 3. 5 is divisible by 5.'
      }
    ],
    testCases: [
      { input: '3', expectedOutput: '1\n2\nFizz', isPublic: true },
      { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isPublic: true },
      { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', isPublic: false },
      { input: '1', expectedOutput: '1', isPublic: false },
      { input: '20', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz', isPublic: false }
    ],
    time_limit: 1000,
    memory_limit: 256
  }
];

async function addProblems() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const problemRepository = AppDataSource.getRepository(Problem);
    const testCaseRepository = AppDataSource.getRepository(TestCase);

    for (const problemData of problems) {
      // Check if problem already exists
      const existingProblem = await problemRepository.findOne({
        where: { slug: problemData.slug }
      });

      if (existingProblem) {
        console.log(`Problem "${problemData.title}" already exists, skipping...`);
        continue;
      }

      // Create problem
      const problem = problemRepository.create({
        title: problemData.title,
        slug: problemData.slug,
        difficulty: problemData.difficulty,
        statement: problemData.statement,
        constraints: problemData.constraints,
        input_format: problemData.input_format,
        output_format: problemData.output_format,
        examples: problemData.examples,
        timeLimit: problemData.timeLimit,
        memoryLimit: problemData.memoryLimit,
        points: problemData.points,
        isActive: true
      });

      const savedProblem = await problemRepository.save(problem);
      console.log(`Created problem: ${savedProblem.title}`);

      // Create test cases
      for (const testCaseData of problemData.testCases) {
        const testCase = testCaseRepository.create({
          problem: savedProblem,
          input: testCaseData.input,
          expectedOutput: testCaseData.expectedOutput,
          isPublic: testCaseData.isPublic
        });
        await testCaseRepository.save(testCase);
      }
      console.log(`Added ${problemData.testCases.length} test cases for ${savedProblem.title}`);
    }

    console.log('All problems added successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error adding problems:', error);
    process.exit(1);
  }
}

addProblems();