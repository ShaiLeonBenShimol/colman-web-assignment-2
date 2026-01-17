import { StringValue } from 'ms';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const requiredEnvVar = (varname: string) => {
    const value = process.env[varname];
    if (!value) {
        throw new Error(`Missing Env Var: ${varname}`)
    }

    return value;
}

const env = {
    PORT: process.env.PORT || 4000,
    DATABASE_URI: process.env.DATABASE_URI || 'mongodb://localhost:27017',
    ACCESS_TOKEN_SECRET: requiredEnvVar("ACCESS_TOKEN_SECRET"),
    REFRESH_TOKEN_SECRET: requiredEnvVar("REFRESH_TOKEN_SECRET"),
    JWT_TOKEN_EXPIRATION: requiredEnvVar("JWT_TOKEN_EXPIRATION") as StringValue
}

export default env;