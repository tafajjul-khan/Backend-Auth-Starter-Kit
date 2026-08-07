import multer, { StorageEngine } from "multer";
import { NextFunction, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { AppError } from "../utils/appError.ts";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// get request from req
const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadPath = path.join(__dirname, "..", "..", "temp", "my-upload");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only jpeg,png and webp are allowed"));
  }
};

const multerUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 mb
  },
});

export const uploadSingleImage = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    multerUpload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        if (
          err instanceof multer.MulterError &&
          err.code === "LIMIT_FILE_SIZE"
        ) {
          return next(
            new AppError(400, "File is too large. Maximum size allowed is 5MB"),
          );
        }

        return next(new AppError(400, err.message || "File upload failed"));
      }

      next();
    });
  };
};
