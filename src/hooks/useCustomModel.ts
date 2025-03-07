import { useState, useEffect } from 'react';
import { getCustomModels , createCustomModel , updateCustomModel, deleteCustomModel } from '../lib/api';


export function useCustomModel()  {
    const [customModels , setCustomModels]= useState<any>() ; 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    

    useEffect(() => {
        // loadCustomModels() ; 
        //  loadCustomModels() ; 
    } , [] ) ; 
    useEffect(() => {
        console.log("custom models = > " , customModels) ;


    } , [customModels])
    async function loadCustomModels()  {
        setLoading(true) ;
        try{
            const data = await getCustomModels() ; 
            setCustomModels(data) ; 
            console.log("custom models  =" , data)  ;
            setLoading(false) ;
            return data ; 
        }
        catch(err : any ) 
        {
            setError(err?.message) ; 
            console.log("Something went wrong : "  , err || err?.message ) ;
        }
        finally{
            setLoading(false) ;
        }
    }

    async function createCustomModels(custom_model: any ) {
    
        try {
          console.log("custom model  " , custom_model);
          const created = await createCustomModel(custom_model);
          setCustomModels([...customModels , created]) ;
          return created;
        } catch (err: any) {
          setError(err.message);
          throw err;
        }
      }

      async function updateCustomModels(id: string , updates:any ) {
          try {
            console.log("custom model updates = " , updates);
            const updated = await updateCustomModel(id , updates);
            setCustomModels(customModels.map((model) => model?.id == id ? updated : model  ))
            return updated;
          } catch (err: any) {
            setError(err.message);
            throw err;
          }
        }

        async function deleteModel(id : string ) 
        {
          try{
            await deleteCustomModel(id) ; 
          }
          catch(err : any) 
          {
            setError(err?.message) ; 
          }
        }

    return {
        loadCustomModels ,
        updateCustomModels , 
        createCustomModels  ,
        deleteModel, 
        

    }

}