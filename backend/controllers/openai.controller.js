import fs from 'fs' ;
import OpenAI from 'openai';
import dotenv from 'dotenv' ;
dotenv.config() 
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});

async function uploadDataset(jsonlPath) {
    console.log("json path = " , jsonlPath)  ; 
  try {
    const response = await openai.files.create({
      file: fs.createReadStream(jsonlPath),
      purpose: "fine-tune",
    });
    if (!response || !response.id) {
        throw new Error("File upload failed: No file ID returned.");
    }
      
    console.log("File uploaded:", response);
    return response ;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error
  }
}
async function fineTuneModel(fileId , customModel ) {
  try {
    const response = await openai.fineTuning.jobs.create({
      training_file: fileId,
      model: customModel,
    });
    if (!response || !response.id) {
        throw new Error("File upload failed: No file ID returned.");
    }
    console.log("Fine-tuning started:", response);

    return response ; 
  } catch (error) {
    console.error("Error starting fine-tuning:", error);
    throw error 
  }
}

async function useFineTunedModel(model) {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Generate an Instagram caption for a travel photo." }]
    });

    console.log("Response:", response.choices[0].message.content);
  } catch (error) {
    console.error("Error using fine-tuned model:", error);
  }
}




const fintuningModelHandler = async (req , res ) => {
    const {customModel} = req.body ; 
    if(!customModel) 
    {
        return res.status(400).json({message : "Invalid body"}) ;

    }
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded or invalid file type" });
    
    }
    const filePath = req.file.path;
    const jsonlPath = filePath.replace(".json", ".jsonl");
    try {  
        const rawData = fs.readFileSync(filePath, "utf8");
        let jsonData = JSON.parse(rawData);
        if (!Array.isArray(jsonData)) {
          jsonData = [jsonData]; 
        }
        const jsonlData = jsonData.map((obj) => JSON.stringify(obj)).join("\n");
    fs.writeFileSync(jsonlPath, jsonlData, "utf8");
    const {id} = await uploadDataset(jsonlPath);
    const {model} = await fineTuneModel(id  , customModel );
    return res.status(201).json({model : model})

    }
    catch(err)
    {
        console.log("Something went wrong " , err?.message || err) ; 
        return res.status(500).json({message : `Something went wrong while tuning the model ${err?.message}`})
    }
}

export {fintuningModelHandler} ; 