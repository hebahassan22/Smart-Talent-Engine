import axios from "axios";

export async function rankResumes({ files, jobDescription, jobRole, onProgress, recruiterId }) {
  const formData = new FormData();
  files.forEach((file) => formData.append("resumes", file));
  formData.append("jobDescription", jobDescription);
  if (jobRole) formData.append("jobRole", jobRole);

  const response = await axios.post("/rank", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-recruiter-id": recruiterId || "anonymous",
    },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return response.data;
}