import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(`PATH: ${req.path} - ERROR: ${err.message}`);
    // res.status(500).json({
    //     status: 'error',
    //     message: err.message || 'Internal Server Error',
    // });

    res.status(500).send("Internal Server Error")
}


export default errorHandler;