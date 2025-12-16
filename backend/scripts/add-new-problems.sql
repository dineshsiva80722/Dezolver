-- Delete existing problems if they exist
DELETE FROM problems WHERE slug IN ('two-sum-v2', 'palindrome-number', 'reverse-integer');

-- Insert new problems
INSERT INTO problems (title, slug, statement, input_format, output_format, constraints, difficulty, time_limit, memory_limit, is_public, created_at, updated_at)
VALUES 
(
  'Two Sum V2',
  'two-sum-v2',
  E'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\n**Example:**\nInput:\n4\n2 7 11 15\n9\n\nOutput:\n0 1\n\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].',
  E'First line contains the number of elements n.\nSecond line contains n space-separated integers.\nThird line contains the target value.',
  'Two space-separated integers representing the indices (0-based) of the two numbers.',
  E'2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
  'easy',
  1000,
  256,
  true,
  NOW(),
  NOW()
),
(
  'Palindrome Number',
  'palindrome-number',
  E'Given an integer x, return true if x is a palindrome, and false otherwise.\n\nAn integer is a palindrome when it reads the same forward and backward.\n\nFor example, 121 is a palindrome while 123 is not.\n\n**Example 1:**\nInput: 121\nOutput: true\nExplanation: 121 reads as 121 from left to right and from right to left.\n\n**Example 2:**\nInput: -121\nOutput: false\nExplanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.',
  'A single integer x.',
  'Print "true" if the number is a palindrome, "false" otherwise.',
  '-2^31 <= x <= 2^31 - 1',
  'easy',
  1000,
  256,
  true,
  NOW(),
  NOW()
),
(
  'Reverse Integer',
  'reverse-integer',
  E'Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.\n\nAssume the environment does not allow you to store 64-bit integers (signed or unsigned).\n\n**Example 1:**\nInput: x = 123\nOutput: 321\n\n**Example 2:**\nInput: x = -123\nOutput: -321\n\n**Example 3:**\nInput: x = 120\nOutput: 21',
  'A single integer x.',
  'The reversed integer, or 0 if it overflows.',
  '-2^31 <= x <= 2^31 - 1',
  'easy',
  1000,
  256,
  true,
  NOW(),
  NOW()
);