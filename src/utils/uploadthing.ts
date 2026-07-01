// src/utils/uploadthing.ts
import { genUploader } from "uploadthing/client";

export const { uploadFiles } = genUploader({
  url: typeof window !== "undefined" ? window.location.origin + "/api/uploadthing" : "",
});
