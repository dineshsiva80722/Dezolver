import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, DocumentArrowDownIcon, FolderOpenIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { workspaceAPI } from '../services/api';

interface WorkspaceFile {
  id: string;
  name: string;
  language: string;
  content: string;
  created_at: string;
}

const LANGUAGE_EXTENSIONS = {
  'python': 'py',
  'javascript': 'js',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'go': 'go',
  'rust': 'rs',
  'csharp': 'cs'
};

const LANGUAGE_CONFIGS = {
  'python': { 
    extension: python(), 
    template: `# Python Workspace
print("Hello, World!")

# Input example
name = input("Enter your name: ")
print(f"Hello, {name}!")

# Basic operations
x = 10
y = 20
print(f"Sum: {x + y}")
`,
    filename: 'main.py'
  },
  'javascript': { 
    extension: javascript(), 
    template: `// JavaScript Workspace
console.log("Hello, World!");

// Input example (use prompt() for input)
// const name = prompt("Enter your name:");
// console.log(\`Hello, \${name}!\`);

// Basic operations
const x = 10;
const y = 20;
console.log(\`Sum: \${x + y}\`);

// Function example
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));
`,
    filename: 'main.js'
  },
  'java': { 
    extension: java(), 
    template: `// Java Workspace
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Input example
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        System.out.println("Hello, " + name + "!");
        
        // Basic operations
        int x = 10;
        int y = 20;
        System.out.println("Sum: " + (x + y));
        
        scanner.close();
    }
}
`,
    filename: 'Main.java'
  },
  'cpp': { 
    extension: cpp(), 
    template: `// C++ Workspace
#include <iostream>
#include <string>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    
    // Input example
    string name;
    cout << "Enter your name: ";
    getline(cin, name);
    cout << "Hello, " << name << "!" << endl;
    
    // Basic operations
    int x = 10;
    int y = 20;
    cout << "Sum: " << (x + y) << endl;
    
    return 0;
}
`,
    filename: 'main.cpp'
  },
  'c': { 
    extension: cpp(), 
    template: `// C Workspace
#include <stdio.h>
#include <string.h>

int main() {
    printf("Hello, World!\\n");
    
    // Input example
    char name[100];
    printf("Enter your name: ");
    fgets(name, sizeof(name), stdin);
    name[strcspn(name, "\\n")] = 0; // Remove newline
    printf("Hello, %s!\\n", name);
    
    // Basic operations
    int x = 10;
    int y = 20;
    printf("Sum: %d\\n", x + y);
    
    return 0;
}
`,
    filename: 'main.c'
  }
};

const WorkspacePage: React.FC = () => {
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>(LANGUAGE_CONFIGS['python'].template);
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(14);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('default');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved files from localStorage
    const savedFiles = localStorage.getItem('workspace-files');
    if (savedFiles) {
      try {
        setFiles(JSON.parse(savedFiles));
      } catch (error) {
        console.error('Error loading saved files:', error);
      }
    }

    // Load workspace settings
    const savedSettings = localStorage.getItem('workspace-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setIsDarkTheme(settings.isDarkTheme ?? true);
        setFontSize(settings.fontSize ?? 14);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save workspace settings
    localStorage.setItem('workspace-settings', JSON.stringify({
      isDarkTheme,
      fontSize
    }));
  }, [isDarkTheme, fontSize]);

  useEffect(() => {
    // Save files to localStorage
    localStorage.setItem('workspace-files', JSON.stringify(files));
  }, [files]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (currentFile === 'default') {
      setCode(LANGUAGE_CONFIGS[newLanguage as keyof typeof LANGUAGE_CONFIGS]?.template || '');
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setIsRunning(true);
    setOutput('Running...');

    try {
      const response = await workspaceAPI.executeCode({
        language: language,
        source_code: code,
        input: input,
        file_name: LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS]?.filename || 'main'
      });

      if (response.success) {
        setOutput(response.data?.output || response.data?.stdout || 'Code executed successfully');
        toast.success('Code executed successfully!');
      } else {
        setOutput(response.data?.error || response.data?.stderr || 'Execution failed');
        toast.error('Code execution failed');
      }
    } catch (error: any) {
      setOutput(error.response?.data?.message || 'Failed to execute code');
      toast.error('Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const createNewFile = () => {
    const fileName = prompt('Enter file name (without extension):');
    if (!fileName) return;

    const newFile: WorkspaceFile = {
      id: Date.now().toString(),
      name: `${fileName}.${LANGUAGE_EXTENSIONS[language as keyof typeof LANGUAGE_EXTENSIONS] || 'txt'}`,
      language: language,
      content: LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS]?.template || '',
      created_at: new Date().toISOString()
    };

    setFiles(prev => [...prev, newFile]);
    setCurrentFile(newFile.id);
    setCode(newFile.content);
    toast.success('New file created!');
  };

  const openFile = (file: WorkspaceFile) => {
    setCurrentFile(file.id);
    setCode(file.content);
    setLanguage(file.language);
  };

  const saveCurrentFile = () => {
    if (currentFile === 'default') {
      createNewFile();
      return;
    }

    setFiles(prev => prev.map(file => 
      file.id === currentFile 
        ? { ...file, content: code, language: language }
        : file
    ));
    toast.success('File saved!');
  };

  const downloadCode = () => {
    const filename = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS]?.filename || 'code.txt';
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Code downloaded!');
  };

  const clearOutput = () => {
    setOutput('');
  };

  const extensions = [
    LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS]?.extension || javascript(),
    EditorView.theme({
      '&': {
        fontSize: `${fontSize}px`,
      },
    }),
  ];

  if (isDarkTheme) {
    extensions.push(oneDark);
  }

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Code Workspace</h1>
            <div className="flex items-center space-x-2">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={`${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-md px-3 py-2`}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`${isDarkTheme ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} p-2 rounded-md transition-colors`}
              title="Settings"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={createNewFile}
              className={`${isDarkTheme ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2`}
            >
              <span>New File</span>
            </button>

            <button
              onClick={downloadCode}
              className={`${isDarkTheme ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} text-white p-2 rounded-md transition-colors`}
              title="Download Code"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className={`${isRunning ? 'bg-gray-400 cursor-not-allowed' : isDarkTheme ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} text-white px-6 py-2 rounded-md transition-colors flex items-center space-x-2`}
            >
              <PlayIcon className="h-5 w-5" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`${isDarkTheme ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} mt-4 p-4 rounded-md border`}>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isDarkTheme}
                  onChange={(e) => setIsDarkTheme(e.target.checked)}
                  className="rounded"
                />
                <span>Dark Theme</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <span>Font Size:</span>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-20"
                />
                <span>{fontSize}px</span>
              </label>
            </div>
          </div>
        )}

        {/* File Tabs */}
        {files.length > 0 && (
          <div className="flex items-center space-x-2 mt-4 overflow-x-auto">
            <button
              onClick={() => {
                setCurrentFile('default');
                setCode(LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS]?.template || '');
              }}
              className={`${currentFile === 'default' 
                ? isDarkTheme ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : isDarkTheme ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              } px-3 py-1 rounded text-sm transition-colors whitespace-nowrap`}
            >
              Default
            </button>
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => openFile(file)}
                className={`${currentFile === file.id 
                  ? isDarkTheme ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : isDarkTheme ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                } px-3 py-1 rounded text-sm transition-colors whitespace-nowrap`}
              >
                {file.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border-b px-4 py-2 flex items-center justify-between`}>
            <span className="text-sm font-medium">
              {LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS]?.filename || 'code.txt'}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={saveCurrentFile}
                className={`${isDarkTheme ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} px-3 py-1 rounded text-sm transition-colors`}
              >
                Save
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <CodeMirror
              value={code}
              onChange={setCode}
              extensions={extensions}
              theme={isDarkTheme ? oneDark : undefined}
              className="h-full"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: false,
              }}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className={`w-96 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border-l flex flex-col`}>
          {/* Input Section */}
          <div className={`${isDarkTheme ? 'border-gray-700' : 'border-gray-300'} border-b`}>
            <div className={`${isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-2 text-sm font-medium`}>
              Input
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for your program..."
              className={`${isDarkTheme ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} w-full h-32 p-3 border-0 resize-none focus:outline-none`}
            />
          </div>

          {/* Output Section */}
          <div className="flex-1 flex flex-col">
            <div className={`${isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-2 text-sm font-medium flex items-center justify-between`}>
              <span>Output</span>
              {output && (
                <button
                  onClick={clearOutput}
                  className={`${isDarkTheme ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'} px-2 py-1 rounded text-xs transition-colors`}
                >
                  Clear
                </button>
              )}
            </div>
            <div
              ref={outputRef}
              className={`${isDarkTheme ? 'bg-gray-900 text-green-400' : 'bg-gray-50 text-gray-900'} flex-1 p-3 font-mono text-sm overflow-auto whitespace-pre-wrap`}
            >
              {output || 'Output will appear here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
