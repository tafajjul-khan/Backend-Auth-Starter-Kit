import dotenv from 'dotenv';
import path from 'path';
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Yeh code project ke root folder se .env ko dhoondhega
dotenv.config({ path: path.resolve(__dirname, '../.env') }); 
