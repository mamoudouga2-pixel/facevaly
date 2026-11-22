import axios, {
    type AxiosInstance,
    type AxiosResponse,
    type AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";
import {
    API_BASE_URL,
} from "../config/api";
import {
    ensureCsrf,
    getCsrfToken,
    rememberCsrfToken,
    resetCsrf,
    requiresCsrf,
} from "./csrfBootstrap";

/*
 * Session-cookie SPA auth. Do NOT enable axios withXSRFToken — it reads
 * document.cookie on the SPA host, which is often a stale/duplicate
 * XSRF-TOKEN after Domain= cookie migrations and overwrites the correct
 * memory token from X-XSRF-TOKEN (cross-origin facevaly.com → backbone).
 */
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = false;

const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
    withCredentials: true,
    withXSRFToken: false,
    xsrfCookieName: "",
    xsrfHeaderName: "",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

type RetriableConfig = InternalAxiosRequestConfig & {
    _csrfRetried?: boolean;
};

/**
 * Always force-refresh by default — auth flows must not reuse a stale
 * in-memory "csrfReady" flag from an earlier page visit in the same tab.
 */
export const initializeCsrf = async (force = true): Promise<void> => {
    await ensureCsrf(force);
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (requiresCsrf(config.method)) {
        const token = getCsrfToken();
        if (token) {
            config.headers.set("X-XSRF-TOKEN", token);
        }
    }
    return config;
});

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        rememberCsrfToken(
            response.headers?.["x-xsrf-token"]
            || response.headers?.["X-XSRF-TOKEN"]
        );
        return response;
    },
    async (error: AxiosError) => {
        const status = error.response?.status;
        const config = error.config as RetriableConfig | undefined;
        const code = (error.response?.data as { code?: string } | undefined)?.code;

        if (
            config
            && !config._csrfRetried
            && (status === 419 || code === "CSRF_MISMATCH")
        ) {
            config._csrfRetried = true;
            resetCsrf();
            try {
                await ensureCsrf(true);
                return apiClient.request(config);
            } catch {
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
