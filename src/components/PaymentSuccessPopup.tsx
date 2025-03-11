
import { CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
const PaymentSuccessPopup = () => {
    const {setPaymentStatus} = useAuth()  ; 
  return (
    <div className="fixed inset-0 flex   items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className="bg-white p-6 rounded-2xl shadow-xl text-center w-80 "
      >
        <div
          className="flex flex-col gap-4 justify-center"
        >
          <CheckCircle className="text-green-500 w-16 h-16" />
        <h2 className="text-xl font-semibold mt-4">Payment Successful!</h2>
        <p className="text-gray-500 mt-2">Your transaction has been completed.</p>
        <button
          onClick={() => {setPaymentStatus(false) } }
          className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
        >
          OK
        </button>
        </div>
    </div>
    </div>
  );
};

export default PaymentSuccessPopup;
