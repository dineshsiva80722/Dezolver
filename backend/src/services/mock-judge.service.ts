import { logger } from '../utils/logger';
import { SubmissionVerdict } from '../types/enums';

interface MockExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
}

export class MockJudgeService {
  // Simulate code execution for different languages
  static async executeCode(params: {
    language: string;
    sourceCode: string;
    stdin?: string;
    expectedOutput?: string;
    timeLimit?: number;
    memoryLimit?: number;
  }): Promise<MockExecutionResult> {
    logger.info('Using mock judge service for code execution');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Basic pattern matching for common solutions
    const code = params.sourceCode.toLowerCase();
    const input = params.stdin || '';
    
    // Check for obvious syntax errors
    if (code.includes('import') && params.language === 'c') {
      return {
        stdout: null,
        stderr: "error: unknown type name 'import'",
        compile_output: "Compilation error: invalid syntax",
        status: { id: 6, description: 'Compilation Error' },
        time: '0',
        memory: 0
      };
    }

    // Simulate Two Sum solution
    if (input.includes('2 7 11 15') && input.includes('9')) {
      if (code.includes('for') || code.includes('while')) {
        return {
          stdout: '0 1\n',
          stderr: null,
          compile_output: null,
          status: { id: 3, description: 'Accepted' },
          time: '0.012',
          memory: 2048
        };
      }
    }

    // Simulate generic test case
    if (params.expectedOutput) {
      // Random chance of success for demonstration
      const isCorrect = Math.random() > 0.3;
      
      if (isCorrect) {
        return {
          stdout: params.expectedOutput,
          stderr: null,
          compile_output: null,
          status: { id: 3, description: 'Accepted' },
          time: (Math.random() * 0.1).toFixed(3),
          memory: Math.floor(Math.random() * 5000) + 1000
        };
      } else {
        // Simulate various error types
        const errorTypes: Array<{
          stdout: string | null;
          stderr: string | null;
          status: { id: number; description: string };
        }> = [
          {
            stdout: params.expectedOutput.replace(/\d/g, '0'),
            stderr: null,
            status: { id: 4, description: 'Wrong Answer' }
          },
          {
            stdout: null,
            stderr: 'Runtime Error: division by zero',
            status: { id: 7, description: 'Runtime Error (SIGSEGV)' }
          },
          {
            stdout: null,
            stderr: 'Time Limit Exceeded',
            status: { id: 5, description: 'Time Limit Exceeded' }
          }
        ];
        
        const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        return {
          ...error,
          compile_output: null,
          time: error.status.id === 5 ? '1.000' : '0.050',
          memory: 2048
        };
      }
    }

    // Default response
    return {
      stdout: 'Hello World\n',
      stderr: null,
      compile_output: null,
      status: { id: 3, description: 'Accepted' },
      time: '0.001',
      memory: 1024
    };
  }

  static async batchExecute(
    testCases: Array<{ input: string; expectedOutput: string }>,
    params: {
      language: string;
      sourceCode: string;
      timeLimit?: number;
      memoryLimit?: number;
    }
  ): Promise<MockExecutionResult[]> {
    const results: MockExecutionResult[] = [];
    
    for (const testCase of testCases) {
      const result = await this.executeCode({
        ...params,
        stdin: testCase.input,
        expectedOutput: testCase.expectedOutput
      });
      results.push(result);
      
      // Stop on first non-accepted result
      if (result.status.id !== 3) {
        break;
      }
    }
    
    return results;
  }

  static mapStatusToVerdict(statusId: number): string {
    const statusMap: Record<number, string> = {
      1: 'pending',
      2: 'processing', 
      3: 'accepted',
      4: 'wrong_answer',
      5: 'time_limit_exceeded',
      6: 'compilation_error',
      7: 'runtime_error',
      8: 'runtime_error',
      9: 'runtime_error',
      10: 'runtime_error',
      11: 'runtime_error',
      12: 'runtime_error',
      13: 'internal_error',
      14: 'runtime_error'
    };
    
    return statusMap[statusId] || 'internal_error';
  }
}

export default MockJudgeService;
