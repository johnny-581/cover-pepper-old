import 'dotenv/config';

const required = (key) => {
    const v = process.env[key];
    if (!v) throw new Error(`Missing required env var: $ ${key}`);
    return v
}

export const ENV = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: parseInt(process.env.PORT || '4000', 10),
    DATABASE_URL: required("DATABASE_URL"),
    SESSION_SECRET: required("SESSION_SECRET"),
    CLIENT_ORIGIN: required("CLIENT_ORIGIN"),
    GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
    GOOGLE_CALLBACK_URL: required("GOOGLE_CALLBACK_URL"),
    GEMINI_API_KEY: required("GEMINI_API_KEY"),
    LATEX_COMPILER_API_URL: required("LATEX_COMPILER_API_URL"),
}