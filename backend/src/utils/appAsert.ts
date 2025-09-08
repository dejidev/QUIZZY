import assert from "node:assert";
import AppError from "./appError";
import { HttpStatusCode } from "../constants/http";
import AppErrorCode from "../constants/appErrorCode";

// Define the type of the custom assert function
type Appsert = (
    condition: unknown,
    httpStatusCode: HttpStatusCode,
    message: string,
    appErrorCode?: AppErrorCode
) => asserts condition;

// Implementation of the assert function
const appAssert: Appsert = (
    condition,
    httpStatusCode,
    message,
    appErrorCode
) => {
    assert(condition, new AppError(httpStatusCode, message, appErrorCode));
};

export default appAssert;
