import React, { useEffect, useState } from 'react';
import { Brain, Upload, Loader, AlertCircle, Code, Check, Play, CircleFadingPlusIcon, LucideMessageCirclePlus, Plus } from 'lucide-react';
import StringDropdown from '../components/StringDropdown';
import { useCustomModel } from '../hooks/useCustomModel';
import { generatePostFromCustomModel } from '../lib/openai';
import { useAuth } from '../context/AuthContext';
import { BACKEND_APIPATH } from '../constants';
import { deleteCustomModel } from '../lib/api';
import {useProfile} from '../hooks/useProfile' ; 
import { useNavigate } from 'react-router-dom';

interface TrainingStatus {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'training' | 'completed' | 'failed';
  error?: string;
}

interface CustomModel {
  id: string;
  model_name : string ; 
  base_model: string;
  custom_model: string;
  profileid : string, 
  created_at : string;
  selected : boolean ; 
  status: 'training' | 'completed' | 'failed';
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
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormat, setShowFormat] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [modelName , setModelName] = useState<string >("");
  const [training , setTraining ] = useState<boolean>(false);
  const [file , setFile] = useState<File | null>(null);
  const [selectedCustomModel , setSelectedCustomModel] = useState<string > ("" );
  const {createCustomModels, loadCustomModels  , updateCustomModels  } = useCustomModel();
  const [trainingSessions , setTrainingSession] = useState<TrainingStatus[]>([]);
  const [models , setModels] = useState<CustomModel[]>([]);
  const {profile , updateProfile}  = useProfile();
  const {setRefreshHeader}  = useAuth();
  const navigateTo = useNavigate();

  useEffect(()  => {
    ;(async () => {
      const data = await loadCustomModels();
      setModels(data);
      const custommodel = data.find((modell) => modell.selected == true )
      if(custommodel) 
      {
        setSelectedModel(custommodel.id);
        setSelectedCustomModel(custommodel.custom_model);
      }
    })()
  }  , [trainingSessions ] )

  const handleTest = async () => {
    if (!selectedModel || !selectedCustomModel || !testInput) return;
    setTesting(true);
    setTestResult(null);
    console.log("selected custom model id = " , selectedCustomModel);
    try {
      const response = await generatePostFromCustomModel( testInput)
      setTestResult(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleCustomModelSelection = async (model : any ) => {
    setSelectedModel(model.id);
    setSelectedCustomModel(model.custom_model);
    const custommodel = models.find((modell) => modell.selected == true )
    if(custommodel) {
      await updateCustomModels( custommodel?.id  , {selected : false })
      await updateCustomModels(model.id ,{selected : true } )
    }
    else{
      await updateCustomModels(model.id ,{selected : true } )
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      console.log("json file = " , event.target.files[0]);
    }
  }

  const handleModelTraining = async () => {
    if((profile?.tokens - 50 ) <  0 ) 
      {
        setError("You do not have enough tokens for custom model training ..");
        navigateTo("/pricing"); 
        return;
    } 

    if(!file) 
    {
      setError( "please upload file first" )
      setTraining(false);
      return;
    }
    if(selectedItem == "") 
    {
      setError("Please select model")
      setTraining(false);
      return;
    }
    if(modelName == "") 
    {
      setError("Please enter your model name to continue")
      setTraining(false);
      return;
    }
    setTraining(true);
    if ( modelName !== "" ) {setTrainingSession((prev) => {
      return [
        ...prev , 
        {
          
          name: modelName,
          status: 'training'
        } , 
      ]
    })
  }
  setProgress(10);
  const interval = setInterval(() => {
    setProgress((prev) => (prev < 90 ? prev + 10 : prev));
  }, 300);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("customModel" , selectedItem)
  const createdModel = await createCustomModels({
    model_name : modelName , 
    base_model: selectedItem  , 
    custom_model: "" , 
    status: "training"  , 
  })
  try {
    const response = await fetch(`${BACKEND_APIPATH.BASEURL}/tune/custom/model`, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    console.log(result);
    if(!result?.model)
    {
      console.log("Something went wrong while tuning the model");
      throw Error("failed while tuning the model")
    }
    await updateCustomModels(createdModel?.id , {
      custom_model : result?.model , 
      status : "completed"
    })
    setProgress(100);
    if((profile?.tokens - 50 ) >= 0 ) 
      {
        await updateProfile({tokens : profile?.tokens - 10 })
        setRefreshHeader((prev) => !prev);
    } 
  } catch (error : any ) {
    console.error("Error uploading file:", error);
    setError(error?.message);
    await deleteCustomModel(createdModel?.id);
  }
  finally{
    setTraining(false);
    setTrainingSession([]);
    clearInterval(interval);
      setTimeout(() => {
        setProgress(0);
        setLoading(false);
      }, 1000);
  }
  }

  const handleChangeToDefaultModel = async () => {
    const data = await loadCustomModels();
    const custommodel = data.find((model) => model.selected == true);
    if(custommodel) 
    {
      console.log("found custom model now shutting it down")
      await updateCustomModels(custommodel?.id , {selected : false})
      setSelectedModel(null);
      setSelectedCustomModel("");
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Custom Models</h1>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <button
            onClick={() => setShowFormat(!showFormat)}
            className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm sm:text-base"
          >
            <Code className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="hidden xs:inline">Dataset Format</span>
            <span className="xs:hidden">Format</span>
          </button>
          
          <div className="w-full sm:w-auto">
            <StringDropdown selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
          </div>
          
          <div className="relative">
            <input
              type="file"
              accept=".json"
              className="hidden"
              id="dataset-upload"
              disabled={loading}
              onChange={handleFileChange}
            />
            <label
              htmlFor="dataset-upload"
              className={`flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer text-sm sm:text-base ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
                  <span className="hidden xs:inline">Uploading...</span>
                  <span className="xs:hidden">Upload...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="hidden xs:inline">Upload Dataset</span>
                  <span className="xs:hidden">Upload</span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Model Name Input and Train Button */}
      <div className='w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 border-2 border-purple-500 rounded-md overflow-hidden'>
        <input 
          className='flex-1 px-3 sm:px-4 py-3 sm:py-4 text-white text-sm sm:text-base outline-none bg-transparent placeholder-gray-400' 
          placeholder='Enter your model name' 
          value={modelName}
          onChange={(e) => {setModelName(e.target.value)}}
          required 
        />
        <button 
          onClick={handleModelTraining} 
          disabled={training} 
          className={`${training ? 'text-white opacity-50' : 'text-white hover:bg-purple-600'} bg-purple-500 capitalize px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors`}
        >
          {training ? (
            <>
              <span className="hidden xs:inline">Training...</span>
              <span className="xs:hidden">Train...</span>
            </>
          ) : (
            'Train'
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 text-white px-3 sm:px-4 py-3 rounded-lg flex items-start sm:items-center gap-2 text-sm sm:text-base">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset Format */}
      {showFormat && (
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center">
            <Code className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
            Dataset Format
          </h2>
          <div className="bg-gray-900 rounded-lg p-3 sm:p-4 overflow-x-auto">
            <pre className="text-gray-300 text-xs sm:text-sm whitespace-pre-wrap break-words">
              {JSON.stringify(sampleDatasetFormat, null, 2)}
            </pre>
          </div>
          <p className="mt-3 sm:mt-4 text-gray-400 text-xs sm:text-sm">
            Your dataset should be a JSON file following this format. Each entry should include a system message,
            user input, and the desired assistant response.
          </p>
        </div>
      )}

      {/* Training Progress */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center">
          <Brain className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
          Training Progress
        </h2>
        <div className="space-y-3 sm:space-y-4">
          {trainingSessions.map(session => (
            <div key={session.id} className="bg-gray-700 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                <div className="min-w-0">
                  <h3 className="text-white font-medium text-sm sm:text-base truncate">{session.name}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Status: {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </p>
                </div>
                {session.status === 'training' && (
                  <Loader className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 animate-spin flex-shrink-0" />
                )}
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">{progress}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-purple-500 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              {session.error && (
                <p className="mt-2 text-red-400 text-xs sm:text-sm break-words">{session.error}</p>
              )}
            </div>
          ))}
          {trainingSessions.length === 0 && (
            <p className="text-gray-400 text-center py-4 text-sm sm:text-base">No training sessions in progress</p>
          )}
        </div>
      </div>

      {/* Available Models */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Available Custom Models</h2>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <button 
              onClick={handleChangeToDefaultModel} 
              className='bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base transition-colors'
            >
              <span className="hidden xs:inline">Use Default Model</span>
              <span className="xs:hidden">Default Model</span>
            </button>
          </div>
          
          {models.map(model => ( 
            model?.status == "completed" && (
              <div 
                key={model.id}
                className={`bg-gray-700 rounded-lg p-3 sm:p-4 cursor-pointer transition-colors ${
                  selectedModel === model.id ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => {handleCustomModelSelection(model)}}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-white font-semibold text-sm sm:text-base truncate">{model.model_name}</h2>
                    <h3 className="text-white font-medium text-xs sm:text-sm truncate">
                      {model.custom_model + " " + new Date(model.created_at).getUTCMilliseconds()}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Base: {model.base_model}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">Status: {model.status}</p>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                  )}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-gray-400">
                  Created: {new Date(model.created_at).toLocaleDateString()}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Model Testing */}
        {selectedModel && (
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-white">Test Model</h3>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter your test input..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base resize-vertical"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                onClick={handleTest}
                disabled={!testInput || testing}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 text-sm sm:text-base transition-colors"
              >
                {testing ? (
                  <>
                    <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
                    <span className="hidden xs:inline">Testing...</span>
                    <span className="xs:hidden">Test...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span>Test Model</span>
                  </>
                )}
              </button>
            </div>
            
            {testResult && (
              <div className="bg-gray-900 rounded-lg p-3 sm:p-4 mt-3 sm:mt-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-2">Response:</h4>
                <p className="text-white text-sm sm:text-base break-words">{testResult}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}