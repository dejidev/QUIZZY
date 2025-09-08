import AppErrorCode from "../constants/appErrorCode";
import { HttpStatusCode } from "../constants/http";

class AppError extends Error {
    constructor(
        public statusCode: HttpStatusCode,
        public message: string,
        public errCode?: string

    ) {
        super(message)
    }
}


// new AppError(
//     202,
//     "msg",
//     AppErrorCode.InvalidAccessToken
// )


export default AppError;