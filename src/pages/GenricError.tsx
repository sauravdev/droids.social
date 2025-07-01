import React, { useEffect } from "react";

import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function GenricError() {
  const navigateTo = useNavigate();
  const handleRedirectToDashboardOnFailure = async () => {
    setTimeout(() => {
      navigateTo("/");
    }, 2000);
  };

  useEffect(() => {
    handleRedirectToDashboardOnFailure();
  }, []);
  return (
    <motion.div
 className="flex items-center h-[400px] justify-center bg-black bg-opacity-50 z-50"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
>
 <motion.div
   className="bg-white p-6 rounded-2xl h-full shadow-xl text-center w-full flex items-center justify-center"
   initial={{ scale: 0.8, opacity: 0 }}
   animate={{ scale: 1, opacity: 1 }}
   exit={{ scale: 0.8, opacity: 0 }}
   transition={{ duration: 0.3, ease: "easeOut" }}
 >
   <motion.div
     className="flex items-center gap-4 justify-center"
     initial={{ y: -20, opacity: 0 }}
     animate={{ y: 0, opacity: 1 }}
     transition={{ delay: 0.2, duration: 0.4 }}
   >
     <motion.div
       initial={{ scale: 0 }}
       animate={{ scale: 1 }}
       transition={{ type: "spring", stiffness: 200, damping: 10 }}
     >
       <AlertTriangle className="text-orange-500 w-16 h-16" />
     </motion.div>
     
     <div className='flex flex-col items-center justify-center'>
       <h2 className="text-xl font-semibold mt-4">Something Went Wrong!</h2>
       <p className="text-gray-500 mt-2">An unexpected error occurred. Please try again.</p>
     </div>
   </motion.div>
 </motion.div>
</motion.div>
  );
}
