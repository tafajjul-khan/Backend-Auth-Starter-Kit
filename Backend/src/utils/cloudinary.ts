import cloudinary from "../config/cloudinary.ts";
import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

export async function uploadImage(
  filePath: string,
): Promise<UploadApiResponse> {
  try {
    const response = await cloudinary.uploader.upload(filePath, {
      folder: "backend-starter-kit-images",
    });
    return response;
  } catch (error) {
    throw new Error(
      `Upload Failed: ${(error as UploadApiErrorResponse).message}`,
    );
  }
}
export async function deleteImage(
  publicId: string,
): Promise<{ result: string }> {
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    if (response.result !== "ok") {
      throw new Error("Assets not found or already deleted");
    }
    return response;
  } catch (error) {
    throw new Error(`Deletion Failed: ${(error as Error).message}`);
  }
}
export async function updateImage(
  oldPublicId: string,
  newFilePath: string,
): Promise<UploadApiResponse> {
  try {
    await deleteImage(oldPublicId);
    const newResponse = await uploadImage(newFilePath);
    return newResponse;
  } catch (error) {
    throw new Error(`Update Failed: ${(error as Error).message}`);
  }
}
