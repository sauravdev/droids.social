import React, { useState } from 'react';
interface DropDownProps {
  selectedItem : string ,
  setSelectedItem : (arg0 : string) => void 
}
const StringDropdown = ({selectedItem , setSelectedItem} : DropDownProps ) => {
  const options = ["gpt-4o-2024-08-06" , "gpt-3.5-turbo" , "gpt-4o-mini-2024-07-18" , "gpt-4-0613" , "gpt-3.5-turbo-1106" , "gpt-3.5-turbo-0613"];
  
  
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (item : string ) => {
    setSelectedItem(item);
    setIsOpen(false);
  };

  const getPreviewColor   = ()  : string    =>   {
    const colorMap = {
      "gpt-4o-mini": "bg-red-500",
      "gpt-3.5-turbo": "bg-yellow-400",
      "gpt-4o": "bg-red-700",
    };
    return colorMap[selectedItem] || "bg-gray-200";
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-gray-900 text-white  rounded-lg shadow-lg">
      <div className="relative">
        <button 
          type="button"
          className="flex justify-between items-center w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center">
            {selectedItem && (
              <span className={`${getPreviewColor()} w-3 h-3 rounded-full mr-2`}></span>
            )}
            {selectedItem || "Select a model"}
          </span>
          <svg className={`w-5 h-5 ml-2 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white shadow-xl max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            <ul className="py-1">
              {options.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center text-gray-900 cursor-pointer select-none relative py-2 px-4 hover:bg-blue-50 transition-colors duration-150"
                  onClick={() => handleSelect(item)}
                >
                  <span className={`${item === selectedItem ? getPreviewColor() : 'bg-gray-200'} w-3 h-3 rounded-full mr-2`}></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StringDropdown;