import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

interface TestUser {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: string;
}

interface LoginResponse {
  data: {
    user: any;
    token: string;
  };
}

// Test users
const adminUser: TestUser = {
  username: 'admin',
  email: 'admin@techfolks.com',
  password: 'Admin123',
  fullName: 'System Administrator'
};

const problemSetterUser: TestUser = {
  username: 'problemsetter_test',
  email: 'setter@test.com',
  password: 'Setter123',
  fullName: 'Problem Setter Test'
};

const regularUser: TestUser = {
  username: 'regular_test',
  email: 'regular@test.com',
  password: 'Regular123',
  fullName: 'Regular Test User'
};

// Helper functions
async function registerUser(user: TestUser): Promise<void> {
  try {
    await axios.post(`${API_BASE_URL}/auth/register`, user);
    console.log(`✅ Registered user: ${user.username}`);
  } catch (error: any) {
    if (error.response?.data?.message?.includes('already exists')) {
      console.log(`ℹ️  User ${user.username} already exists`);
    } else {
      console.error(`❌ Failed to register ${user.username}:`, error.response?.data?.message);
    }
  }
}

async function loginUser(user: TestUser): Promise<string | null> {
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
      username: user.username,
      password: user.password,
    });
    console.log(`✅ Logged in as: ${user.username}`);
    return response.data.data.token;
  } catch (error: any) {
    console.error(`❌ Failed to login ${user.username}:`, error.response?.data?.message);
    return null;
  }
}

async function promoteToAdmin(username: string, adminToken: string): Promise<void> {
  try {
    await axios.put(
      `${API_BASE_URL}/admin/users/${username}/promote`,
      { role: 'admin' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(`✅ Promoted ${username} to admin`);
  } catch (error: any) {
    console.error(`❌ Failed to promote ${username}:`, error.response?.data?.message);
  }
}

async function promoteToProblemSetter(username: string, adminToken: string): Promise<void> {
  try {
    await axios.put(
      `${API_BASE_URL}/admin/users/${username}/promote`,
      { role: 'problem_setter' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(`✅ Promoted ${username} to problem setter`);
  } catch (error: any) {
    console.error(`❌ Failed to promote ${username}:`, error.response?.data?.message);
  }
}

// CRUD Tests
async function testCreateProblem(token: string): Promise<string | null> {
  try {
    const problemData = {
      title: 'Test Problem - Two Sum',
      statement: 'Given an array of integers and a target sum, find two numbers that add up to the target.',
      input_format: 'First line: n (size of array)\\nSecond line: n integers\\nThird line: target sum',
      output_format: 'Two indices (0-based) that sum to target, or -1 -1 if not found',
      constraints: '2 <= n <= 10^5\\n-10^9 <= array[i] <= 10^9',
      difficulty: 'easy',
      time_limit: 1000,
      memory_limit: 256,
      is_public: true,
      test_cases: [
        {
          input: '4\\n2 7 11 15\\n9',
          expected_output: '0 1',
          is_sample: true,
          points: 10
        },
        {
          input: '3\\n3 2 4\\n6',
          expected_output: '1 2',
          is_sample: false,
          points: 10
        }
      ]
    };

    const response = await axios.post(
      `${API_BASE_URL}/problems`,
      problemData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Created problem:', response.data.data.title);
    return response.data.data.id;
  } catch (error: any) {
    console.error('❌ Failed to create problem:', error.response?.data?.message);
    return null;
  }
}

async function testGetProblems(): Promise<void> {
  try {
    const response = await axios.get(`${API_BASE_URL}/problems`);
    console.log(`✅ Retrieved ${response.data.data.problems.length} problems`);
    response.data.data.problems.forEach((p: any) => {
      console.log(`   - ${p.title} (${p.difficulty})`);
    });
  } catch (error: any) {
    console.error('❌ Failed to get problems:', error.response?.data?.message);
  }
}

async function testGetProblemBySlug(slug: string): Promise<void> {
  try {
    const response = await axios.get(`${API_BASE_URL}/problems/${slug}`);
    console.log('✅ Retrieved problem by slug:', response.data.data.title);
  } catch (error: any) {
    console.error('❌ Failed to get problem by slug:', error.response?.data?.message);
  }
}

async function testUpdateProblem(problemId: string, token: string): Promise<void> {
  try {
    const updateData = {
      title: 'Updated Test Problem - Two Sum Enhanced',
      difficulty: 'medium',
      time_limit: 2000
    };

    const response = await axios.put(
      `${API_BASE_URL}/problems/${problemId}`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Updated problem:', response.data.data.title);
  } catch (error: any) {
    console.error('❌ Failed to update problem:', error.response?.data?.message);
  }
}

async function testDeleteProblem(problemId: string, token: string): Promise<void> {
  try {
    await axios.delete(
      `${API_BASE_URL}/problems/${problemId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Deleted problem');
  } catch (error: any) {
    console.error('❌ Failed to delete problem:', error.response?.data?.message);
  }
}

async function testUnauthorizedAccess(token: string | null): Promise<void> {
  console.log('\\n🔒 Testing Authorization...');
  
  // Test creating problem without admin/problem setter role
  if (token) {
    try {
      await axios.post(
        `${API_BASE_URL}/problems`,
        { title: 'Unauthorized Problem' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.error('❌ Regular user should not be able to create problems!');
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('✅ Regular user correctly denied problem creation');
      }
    }
  }

  // Test accessing problems without auth
  try {
    const response = await axios.get(`${API_BASE_URL}/problems`);
    console.log('✅ Public problem list accessible without auth');
  } catch (error: any) {
    console.error('❌ Public problem list should be accessible');
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Problem CRUD Tests...\\n');

  // Step 1: Register users (skip admin as it already exists)
  console.log('📝 Registering test users...');
  // Admin already exists, skip registration
  console.log('ℹ️  Using existing admin user');
  await registerUser(problemSetterUser);
  await registerUser(regularUser);

  // Step 2: Login users
  console.log('\\n🔐 Logging in users...');
  const adminToken = await loginUser(adminUser);
  const setterToken = await loginUser(problemSetterUser);
  const regularToken = await loginUser(regularUser);

  if (!adminToken) {
    console.error('❌ Cannot proceed without admin token');
    return;
  }

  // Step 3: Promote users (requires initial admin)
  console.log('\\n👑 Setting up user roles...');
  // First admin might need to be created manually or through database seed
  // await promoteToAdmin(adminUser.username, adminToken);
  await promoteToProblemSetter(problemSetterUser.username, adminToken);

  // Step 4: Test CRUD operations
  console.log('\\n🧪 Testing CRUD Operations...\\n');

  // Test CREATE
  console.log('CREATE Test:');
  const problemId = await testCreateProblem(adminToken);

  // Test READ
  console.log('\\nREAD Tests:');
  await testGetProblems();
  await testGetProblemBySlug('test-problem-two-sum');

  // Test UPDATE
  if (problemId) {
    console.log('\\nUPDATE Test:');
    await testUpdateProblem(problemId, adminToken);
  }

  // Test Authorization
  await testUnauthorizedAccess(regularToken);

  // Test DELETE (last to not affect other tests)
  if (problemId) {
    console.log('\\nDELETE Test:');
    await testDeleteProblem(problemId, adminToken);
  }

  console.log('\\n✅ All tests completed!');
}

// Run the tests
runTests().catch(console.error);