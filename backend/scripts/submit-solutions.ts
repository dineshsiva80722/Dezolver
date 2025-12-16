import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000/api';

// Login credentials  
const loginData = {
  username: 'admin',
  password: 'admin123'
};

// Problem solutions mapping
const solutions = {
  'two-sum-v2': {
    language: 'python',
    code: `# Two Sum V2 Solution
n = int(input())
nums = list(map(int, input().split()))
target = int(input())

# Create a hash map to store value -> index
num_map = {}

for i in range(n):
    complement = target - nums[i]
    if complement in num_map:
        print(num_map[complement], i)
        break
    num_map[nums[i]] = i`,
    testInput: '4\n2 7 11 15\n9'
  },
  'palindrome-number': {
    language: 'python',
    code: `# Palindrome Number Solution
x = int(input())

# Negative numbers are not palindromes
if x < 0:
    print("false")
else:
    # Convert to string and check if it's the same when reversed
    str_x = str(x)
    if str_x == str_x[::-1]:
        print("true")
    else:
        print("false")`,
    testInput: '121'
  },
  'reverse-integer': {
    language: 'python',
    code: `# Reverse Integer Solution
x = int(input())

# Handle sign
sign = -1 if x < 0 else 1
x = abs(x)

# Reverse the number
reversed_num = 0
while x > 0:
    reversed_num = reversed_num * 10 + x % 10
    x //= 10

# Apply sign
reversed_num *= sign

# Check for 32-bit integer overflow
if reversed_num < -2**31 or reversed_num > 2**31 - 1:
    print(0)
else:
    print(reversed_num)`,
    testInput: '123'
  }
};

async function submitSolutions() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData);
    const { accessToken } = loginResponse.data;
    console.log('✅ Login successful!');

    // Set auth header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    // Get all problems
    console.log('\n📋 Fetching problems...');
    const problemsResponse = await axios.get(`${API_URL}/problems`);
    const problems = problemsResponse.data.data;

    // Submit solutions for each problem
    for (const [slug, solution] of Object.entries(solutions)) {
      try {
        console.log(`\n🚀 Submitting solution for: ${slug}`);
        
        // Find the problem by slug
        const problem = problems.find((p: any) => p.slug === slug);
        if (!problem) {
          console.log(`❌ Problem '${slug}' not found`);
          continue;
        }

        console.log(`📝 Problem found: ${problem.title} (ID: ${problem.id})`);

        // First, test the code
        console.log('🧪 Testing code...');
        const testResponse = await axios.post(`${API_URL}/problems/${problem.id}/run`, {
          language: solution.language,
          source_code: solution.code,
          input: solution.testInput
        });

        console.log('🔍 Test result:', {
          status: testResponse.data.status,
          output: testResponse.data.output,
          error: testResponse.data.error
        });

        // Submit the solution
        console.log('📤 Submitting solution...');
        const submitResponse = await axios.post(`${API_URL}/problems/${problem.id}/submit`, {
          language: solution.language,
          source_code: solution.code
        });

        console.log('✅ Submission successful!');
        console.log('📊 Submission details:', {
          id: submitResponse.data.submission?.id,
          status: submitResponse.data.submission?.status,
          language: submitResponse.data.submission?.language
        });

        // Wait a bit before next submission
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        console.error(`❌ Error submitting solution for ${slug}:`, 
          error.response?.data || error.message);
      }
    }

    console.log('\n🎉 All submissions completed!');
    
    // Get submission history
    console.log('\n📈 Fetching submission history...');
    const submissionsResponse = await axios.get(`${API_URL}/submissions/my`);
    const submissions = submissionsResponse.data.data;
    
    console.log('\n📋 Recent submissions:');
    submissions.slice(0, 5).forEach((sub: any, index: number) => {
      console.log(`${index + 1}. ${sub.problem?.title} - ${sub.status} (${sub.language})`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

submitSolutions();