import axios from "axios";
import crypto from "node:crypto";
import FormData from "form-data";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

function generateSignature(params: Record<string, string | number>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + API_SECRET).digest("hex");
}

export async function uploadImage(
  file: Express.Multer.File,
  folder: string = "eventura"
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = { timestamp, folder };
  const signature = generateSignature(params);

  const formData = new FormData();
  formData.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    formData,
    { headers: formData.getHeaders() }
  );

  return response.data as { secure_url: string; public_id: string };
}

function extractPublicId(url: string): string {
  const withoutQuery = url.split("?")[0];
  const parts = withoutQuery.split("/");
  const uploadIndex = parts.findIndex((p) => p === "upload");
  const publicIdParts = parts.slice(uploadIndex + 2);
  return publicIdParts.join("/").replace(/\.[^/.]+$/, "");
}

export async function deleteImage(secureUrl: string) {
  const publicId = extractPublicId(secureUrl);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature({ public_id: publicId, timestamp });

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
    formData,
    { headers: formData.getHeaders() }
  );

  return response.data;
}