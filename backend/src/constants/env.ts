import dotenv from "dotenv";
dotenv.config();

const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}


export const MONGO_URI = getEnv('MONGO_URI');
export const PORT = getEnv('PORT','5000');
export const JWT_SECRET = getEnv('JWT_SECRET');
export const JWT_REFRESH_SECRET = getEnv('JWT_REFRESH_SECRET'); 
export const APP_ORIGIN = getEnv('APP_ORIGIN', 'http://localhost:5173');
export const NODE_ENV = getEnv('NODE_ENV', 'development');  
export const EMAIL_SENDER = getEnv('EMAIL_SENDER', 'a');
export const RESEND_API_KEY = getEnv('RESEND_API_KEY', 'a');
export const MONG0_PASSWORD = getEnv('MONG0_PASSWORD', 'quizybackend');   
