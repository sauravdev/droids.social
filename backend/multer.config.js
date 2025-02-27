import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Manually define __dirname in ES modules
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  
  const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/json") {
      cb(null, true);
    } else {
      cb(new Error("Only JSON files are allowed"), false);
    }
  };
  
  const upload = multer({ storage, fileFilter });
export {upload}
