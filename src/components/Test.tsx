import { useState, useEffect } from "react";

const ProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setProgress(10); // Start progress

    // Simulate progress update
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 300);

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulated API call
      setProgress(100);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setProgress(0); // Reset after completion
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="w-full max-w-md p-4 mx-auto">
      <button
        onClick={fetchData}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Loading..." : "Fetch Data"}
      </button>
      <div className="mt-4 w-full bg-gray-200 h-4 rounded overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
