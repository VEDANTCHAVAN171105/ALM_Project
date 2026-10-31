import axios from "axios";


const client = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || "http://localhost:8000").replace(/\/+$/, ""),
  timeout: 180000
});

client.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem("alm-access-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem("alm-access-token");
      window.dispatchEvent(new Event("alm-auth-expired"));
    }
    if (!error.response) {
      const message =
        error.code === "ECONNABORTED"
          ? "Request timed out after 180 seconds."
          : "Cannot connect to server. Is the backend running on port 8000?";
      if (String(error.message || "").toLowerCase().includes("cors")) {
        console.error("[ALM] Possible CORS issue:", error);
      }
      return Promise.reject({
        ...error,
        userMessage: message
      });
    }

    return Promise.reject({
      ...error,
      userMessage: (typeof error.response?.data?.detail === "string" && error.response.data.detail) ||
        error.response?.data?.message ||
        error.response?.data?.detail?.message ||
        "The request could not be completed."
    });
  }
);

export const register = async (credentials) => {
  const response = await client.post("/api/auth/register", credentials);
  return response.data;
};

export const login = async (credentials) => {
  const response = await client.post("/api/auth/login", credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await client.get("/api/auth/me");
  return response.data;
};

export const analyzeAudio = async (formData) => {
  const response = await client.post("/api/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const getHistory = async (limit = 20, offset = 0) => {
  const response = await client.get("/api/history", { params: { limit, offset } });
  return response.data;
};

export const getSession = async (id) => {
  const response = await client.get(`/api/history/${id}`);
  return response.data;
};

export const deleteSession = async (id) => {
  const response = await client.delete(`/api/history/${id}`);
  return response.data;
};

export const checkHealth = async () => {
  const response = await client.get("/api/health");
  return response.data;
};

export default client;
