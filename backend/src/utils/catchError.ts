import { NextFunction, Request, Response } from "express"

type AsyncController = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>



const catchError = (controller: AsyncController) => {
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await controller(req, res, next)
            // throw new Error('This is a test error');
            // return res.status(200).json({
            //     status: 'success'
            // })
        } catch (error) {
            next(error)
        }
    }

}
export default catchError;