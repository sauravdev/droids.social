import React, { useState } from "react";
import { Twitter, Linkedin, Instagram } from 'lucide-react';

const InstructionsModal = ({
  isOpen = true,
  onClose = () => {},
  onAPIKeySubmit
}) => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isInvalidApiKey, setIsInvalidApiKey] = useState(true);

  if (!isOpen) return null;

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const isValidApiKey = (key) =>
    /^([A-Fa-f0-9]{8}-){3}[A-Fa-f0-9]{8}$/.test(key);

  const handleChange = (e) => {
    const value = e.target.value.trim();
    setApiKey(value);

    if (!isValidApiKey(value)) {
      setError("Invalid API key format. Double-check for spaces before or after.");
      setIsInvalidApiKey(true);
    } else {
      setError("");
      setIsInvalidApiKey(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAPIKeySubmit(apiKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-lg p-8 relative">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-purple-500 hover:text-purple-700 transition"
          onClick={onClose}
          aria-label="Close"
        >
          <svg fill="none" viewBox="0 0 24 24" className="w-6 h-6">
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-purple-700">
            Connect Your Social Accounts
          </h2>
          <p className="text-gray-500 mt-2">
            Easily integrate with Ayrshare in just a few steps.
          </p>
        </div>

        <div>
          {/* STEP 1: Create Account */}
          {step === 1 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-purple-600">
                Step 1: Create Your Ayrshare Account
              </h3>
              <ul className="mb-4 text-gray-600 list-disc list-inside space-y-1 text-left">
                <li>
                  <b>Go to Ayrshare and sign up</b> using your email & a password.
                </li>
                <li>
                  Check your inbox for an email verification link and click it to activate your account.
                </li>
              </ul>

              <a
                href="https://app.ayrshare.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-center transition"
              >
                Go to Ayrshare
              </a>

              <button
                className="mt-6 w-full py-2 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-100 font-medium transition"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          )}

          {/* STEP 2: Link Accounts */}
          {step === 2 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-purple-600">
                Step 2: Link Your Social Media Accounts
              </h3>
              <ul className="mb-4 text-gray-600 list-disc list-inside space-y-1 text-left">
                <li>
                  In your Ayrshare <span className="font-semibold text-purple-700">Dashboard</span>, navigate to the <b>&quot;Social Accounts&quot;</b> tab.
                </li>
                <li>
                  Click <b>&quot;Add Account&quot;</b> for any platform you want to connect:
                  <span className="ml-1 inline-flex gap-2 align-middle">
                    <Twitter className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <Instagram className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  </span>
                </li>
                <li>
                  Log in and approve Ayrshare for each network you want to link.
                </li>
                <li>
                  <span className="font-medium text-purple-600">Tip:</span>
                  {" "}
                  You can link or remove accounts anytime from your dashboard.
                </li>
                <li>
                  ➕ <span className="font-medium text-purple-600">After linking, you’ll be able to post to all your connected accounts </span>
                </li>
              </ul>
              <div className="flex justify-between">
                <button
                  className="py-2 px-4 rounded-lg bg-gray-100 text-purple-600 font-medium"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  className="py-2 px-4 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700"
                  onClick={handleNext}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Paste API Key */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h3 className="font-semibold text-lg mb-2 text-purple-600">
                Step 3: Copy & Paste Your API Key
              </h3>
              <p className="mb-3 text-gray-600">
                In your Ayrshare Dashboard, open the <b>API Key</b> section.<br />
                Click <b>Copy</b> and paste your API Key below.
              </p>
              <div className="mb-2">
                <span className="text-xs text-purple-600 font-semibold">🚨 Keep your API Key secret. Never share it publicly.</span>
              </div>
              <input
                maxLength={35}
                type="text"
                className={`w-full mb-2 px-4 py-2 border rounded focus:ring-2 ${error ? "border-red-500 focus:ring-red-400" : "border-purple-200 focus:ring-purple-400"}`}
                placeholder="Paste your Ayrshare API Key here"
                value={apiKey}
                onChange={handleChange}
                required
                autoComplete="off"
              />
              {error && <p className="capitalize bg-red-700 text-gray-200 p-1 rounded-md mb-3 w-full text-center">{error}</p>}

              <div className="flex justify-between mb-4">
                <button
                  type="button"
                  className="py-2 px-4 rounded-lg bg-gray-100 text-purple-600 font-medium"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  disabled={isInvalidApiKey}
                  type="submit"
                  className={`py-2 px-4 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white font-bold ${isInvalidApiKey ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                  Submit API Key
                </button>
              </div>

              
            </form>
          )}
        </div>
        <div className="mt-8 flex justify-center space-x-2">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full ${step === i ? "bg-purple-600" : "bg-purple-100"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstructionsModal;
