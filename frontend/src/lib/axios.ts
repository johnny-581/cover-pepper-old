import Axios from "axios";

const axios = Axios.create({
    baseURL: import.meta.env.VITE_PRODUCTION === "true" ? "/" : import.meta.env.VITE_BACKEND_API_URL,
    withCredentials: true
});

export default axios;