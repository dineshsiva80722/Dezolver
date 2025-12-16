-- Insert problems
INSERT INTO problems (id, title, slug, statement, input_format, output_format, constraints, difficulty, time_limit, memory_limit, is_public, created_at, updated_at)
VALUES 
(
  gen_random_uuid(),
  'Two Sum',
  'two-sum',
  E'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\nExample:\nInput:\n4\n2 7 11 15\n9\n\nOutput:\n0 1\n\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].',
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
  gen_random_uuid(),
  'Palindrome Number',
  'palindrome-number',
  E'Given an integer x, return true if x is a palindrome, and false otherwise.\n\nAn integer is a palindrome when it reads the same forward and backward.\n\nFor example, 121 is a palindrome while 123 is not.\n\nExample 1:\nInput: 121\nOutput: true\nExplanation: 121 reads as 121 from left to right and from right to left.\n\nExample 2:\nInput: -121\nOutput: false\nExplanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.',
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
  gen_random_uuid(),
  'FizzBuzz',
  'fizzbuzz',
  E'Given an integer n, return a list of strings answer where:\n\n- answer[i] == "FizzBuzz" if i is divisible by 3 and 5.\n- answer[i] == "Fizz" if i is divisible by 3.\n- answer[i] == "Buzz" if i is divisible by 5.\n- answer[i] == i (as a string) if none of the above conditions are true.\n\nPrint each string on a new line.\n\nExample 1:\nInput: 3\nOutput:\n1\n2\nFizz\n\nExample 2:\nInput: 5\nOutput:\n1\n2\nFizz\n4\nBuzz',
  'A single integer n.',
  'n lines, each containing the appropriate FizzBuzz value.',
  '1 <= n <= 10^4',
  'easy',
  1000,
  256,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Get problem IDs
WITH problem_ids AS (
  SELECT id, slug FROM problems WHERE slug IN ('two-sum', 'palindrome-number', 'fizzbuzz')
)
-- Insert test cases for Two Sum
INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, points, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM problem_ids WHERE slug = 'two-sum'),
  test.input,
  test.expected_output,
  test.is_sample,
  test.points,
  NOW()
FROM (
  VALUES 
    (E'4\n2 7 11 15\n9', '0 1', true, 0),
    (E'3\n3 2 4\n6', '1 2', true, 0),
    (E'2\n3 3\n6', '0 1', false, 20),
    (E'5\n1 2 3 4 5\n9', '3 4', false, 20),
    (E'6\n-1 -2 -3 -4 -5 10\n5', '4 5', false, 20)
) AS test(input, expected_output, is_sample, points);

-- Insert test cases for Palindrome Number
INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, points, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM problem_ids WHERE slug = 'palindrome-number'),
  test.input,
  test.expected_output,
  test.is_sample,
  test.points,
  NOW()
FROM (
  VALUES 
    ('121', 'true', true, 0),
    ('-121', 'false', true, 0),
    ('10', 'false', true, 0),
    ('0', 'true', false, 15),
    ('1221', 'true', false, 15),
    ('12321', 'true', false, 15),
    ('123456', 'false', false, 15)
) AS test(input, expected_output, is_sample, points);

-- Insert test cases for FizzBuzz
INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, points, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM problem_ids WHERE slug = 'fizzbuzz'),
  test.input,
  test.expected_output,
  test.is_sample,
  test.points,
  NOW()
FROM (
  VALUES 
    ('3', E'1\n2\nFizz', true, 0),
    ('5', E'1\n2\nFizz\n4\nBuzz', true, 0),
    ('15', E'1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', false, 20),
    ('1', '1', false, 20),
    ('20', E'1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz', false, 20)
) AS test(input, expected_output, is_sample, points);