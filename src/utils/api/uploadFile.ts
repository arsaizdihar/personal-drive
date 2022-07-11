import axios from "axios";

export const uploadFile = async (
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void
) => {
  return axios.post("/api/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: onUploadProgress,
  });
};
