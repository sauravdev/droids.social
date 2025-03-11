import React  , {useEffect} from 'react';
import PaymentSuccessPopup from '../components/PaymentSuccessPopup';
import { CheckCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import {motion } from 'framer-motion' ; 
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { getProfile } from '../lib/api';

export function PaymentSuccess() {
  const {setRefreshHeader} = useAuth() ; 
  const { updateProfile} = useProfile() ; 
    const navigateTo  = useNavigate() ; 
    const handleRedirectToDashBoard = () => {
            setTimeout(async () => {
            const profile = await getProfile();
            const newTokens = profile?.tokens + 1000 ; 
            await updateProfile({tokens : newTokens  })
            navigateTo("/") ; 
        } , 3000) 
    }
    useEffect(() => {
        handleRedirectToDashBoard() ; 
    } , [] )
    return  <>
       
       <motion.div
      className="flex items-center justify-center bg-black bg-opacity-50 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white p-6 rounded-2xl shadow-xl text-center w-full "
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="flex flex-col gap-4 justify-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <CheckCircle className="text-green-500 w-16 h-16" />
          </motion.div>

          <h2 className="text-xl font-semibold mt-4">Payment Successful!</h2>
          <p className="text-gray-500 mt-2">Your transaction has been completed.</p>
          <motion.button
            onClick={() => {}}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            OK
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
    </>
}