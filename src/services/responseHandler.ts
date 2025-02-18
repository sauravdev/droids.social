import axios from "axios";

export const responseHandler = (response:any) =>{
        if(response.data){
            return response.data;
        }
        return response;
}

export const errorHandler = (error:any) =>{
     if(axios.isAxiosError(error)){
        throw error;
     }
     else{
        throw new Error("KO 29072 An unexpected error occurred");
     }
}