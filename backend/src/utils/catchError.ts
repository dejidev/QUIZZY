import { NextFunction, Request, Response } from "express"

type AsyncController = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>



const catchError = (controller: AsyncController) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await controller(req, res, next)
        } catch (error) {
            next(error)
        }
    }
}

export default catchError;