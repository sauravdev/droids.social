import React, { useState } from 'react';
import { Brain, Upload, Loader, AlertCircle, Code, Check, Play } from 'lucide-react';

interface TrainingStatus {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'training' | 'completed' | 'failed';
  error?: string;
}

interface CustomModel {
  id: string;
  name: string;
  baseModel: string;
  createdAt: string;
  status: 'active' | 'archived';
}

const sampleDatasetFormat = {
  messages: [
    {
      role: "system",
      content: "Marv is a factual chatbot that is also sarcastic."
    },
    {
      role: "user",
      content: "What's the capital of France?"
    },
    {
      role: "assistant",
      content: "Paris, as if everyone doesn't know that already."
    }
  ]
};

export function CustomModels() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormat, setShowFormat] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const [trainingSessions] = useState<TrainingStatus[]>([
    {
      id: '1',
      name: 'Custom Model Example',
      progress: 45,
      status: 'training'
    }
  ]);

  const [models] = useState<CustomModel[]>([
    {
      id: 'model-1',
      name: 'Social Media Assistant',
      baseModel: 'gpt-4o-mini',
      createdAt: '2024-01-15',
      status: 'active'
    },
    {
      id: 'model-2',
      name: 'Content Generator',
      baseModel: 'gpt-4o-mini',
      createdAt: '2024-01-10',
      status: 'active'
    }
  ]);

  const handleTest = async () => {
    if (!selectedModel || !testInput) return;
    
    setTesting(true);
    setTestResult(null);
    
    try {
      // Simulated API call to test the model
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult("This is a sample response from your custom model. In a real implementation, this would be the actual response from the API.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Custom Models</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFormat(!showFormat)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            <Code className="h-5 w-5" />
            <span>Dataset Format</span>
          </button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              className="hidden"
              id="dataset-upload"
              disabled={loading}
            />
            <label
              htmlFor="dataset-upload"
              className={`flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Upload Dataset</span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 text-white px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Dataset Format */}
      {showFormat && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Code className="h-6 w-6 mr-2" />
            Dataset Format
          </h2>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-gray-300 text-sm">
              {JSON.stringify(sampleDatasetFormat, null, 2)}
            </pre>
          </div>
          <p className="mt-4 text-gray-400 text-sm">
            Your dataset should be a JSON file following this format. Each entry should include a system message,
            user input, and the desired assistant response.
          </p>
        </div>
      )}

      {/* Training Progress */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Brain className="h-6 w-6 mr-2" />
          Training Progress
        </h2>
        <div className="space-y-4">
          {trainingSessions.map(session => (
            <div key={session.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium">{session.name}</h3>
                  <p className="text-gray-400 text-sm">
                    Status: {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </p>
                </div>
                {session.status === 'training' && (
                  <Loader className="h-5 w-5 text-purple-500 animate-spin" />
                )}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">{session.progress}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-purple-500 rounded-full h-2 transition-all"
                    style={{ width: `${session.progress}%` }}
                  />
                </div>
              </div>
              {session.error && (
                <p className="mt-2 text-red-400 text-sm">{session.error}</p>
              )}
            </div>
          ))}
          {trainingSessions.length === 0 && (
            <p className="text-gray-400 text-center py-4">No training sessions in progress</p>
          )}
        </div>
      </div>

      {/* Available Models */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Available Models</h2>
        <div className="space-y-4">
          {models.map(model => (
            <div 
              key={model.id}
              className={`bg-gray-700 rounded-lg p-4 cursor-pointer transition-colors ${
                selectedModel === model.id ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => setSelectedModel(model.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{model.name}</h3>
                  <p className="text-gray-400 text-sm">Base: {model.baseModel}</p>
                </div>
                {selectedModel === model.id && (
                  <Check className="h-5 w-5 text-purple-500" />
                )}
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Created: {new Date(model.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Model Testing */}
        {selectedModel && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium text-white">Test Model</h3>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter your test input..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                onClick={handleTest}
                disabled={!testInput || testing}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    <span>Test Model</span>
                  </>
                )}
              </button>
            </div>
            {testResult && (
              <div className="bg-gray-900 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Response:</h4>
                <p className="text-white">{testResult}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}