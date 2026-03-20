import { env } from "@/config/env";

/**
 * Upload an image file to the API and return a public URL.
 */
export const imageApi = {
  upload: async (file: File, folder: string = "uploads"): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch(`${env.apiBaseUrl}/api/images/upload`, {
      method: "POST",
      headers: {
        "x-api-key": env.apiKey,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Image upload failed: ${res.status}`);
    }

    const data = await res.json();
    return data.url;
  },
};
