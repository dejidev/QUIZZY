import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants/http';
import z from 'zod';
import AppError from '../utils/appError';
import { clearAuthCookies, REFRESHPATH } from '../utils/cookies';


const handleZodError = (res: Response, error: z.ZodError) => {
    const errors = error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message
    }))
    return res.status(BAD_REQUEST).json({
        message: error.message,
        errors
    })
}

const handleAppError = (res: Response, error: AppError) => {
    return res.status(error.statusCode).json({
        message: error.message,
        errorCode: error.errCode
    })
}



const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    console.error(`PATH: ${req.path} - ERROR: ${error.message}`);

    if (req.path === REFRESHPATH) {
        clearAuthCookies(res)
    }

    if (error instanceof z.ZodError) {
        return handleZodError(res, error)
    }

    if (error instanceof AppError) {
        return handleAppError(res, error)
    }

    res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error")
}


export default errorHandler;