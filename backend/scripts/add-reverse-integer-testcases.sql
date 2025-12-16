-- Add test cases for reverse-integer problem

-- Insert test cases for Reverse Integer
INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, points, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM problems WHERE slug = 'reverse-integer'),
  test.input,
  test.expected_output,
  test.is_sample,
  test.points,
  NOW()
FROM (
  VALUES 
    -- Sample test cases (from problem description)
    ('123', '321', true, 0),
    ('-123', '-321', true, 0),
    ('120', '21', true, 0),
    ('0', '0', true, 0),
    
    -- Edge cases (overflow)
    ('1534236469', '0', false, 25),        -- Overflow case
    ('-2147483648', '0', false, 25),       -- Overflow case  
    ('2147483647', '0', false, 25),        -- Overflow case
    ('1463847412', '2147483641', false, 25), -- Just under limit
    
    -- Additional test cases
    ('1', '1', false, 25),
    ('10', '1', false, 25),
    ('100', '1', false, 25),
    ('-1', '-1', false, 25),
    ('987654321', '123456789', false, 25),
    ('-987654321', '-123456789', false, 25),
    ('1000000003', '0', false, 25)         -- Overflow case
) AS test(input, expected_output, is_sample, points)
WHERE EXISTS (SELECT 1 FROM problems WHERE slug = 'reverse-integer');