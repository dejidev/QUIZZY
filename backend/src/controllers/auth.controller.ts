import { CREATED } from "../constants/http";
import { loginSchema, registerSchema } from "../models/auth.model";
import { createAccount, loginUser } from "../services/auth.service";
import catchError from "../utils/catchError";
import { setAuthCookies } from "../utils/cookies";




export const registerHandler = catchError(
    async (req, res, next) => {

        //Validate Request
        const request = registerSchema.parse({
            ...req.body,
            userAgent: req.headers["user-agent"]
        })
        //Call Service
        const { user, accessToken, refreshToken } = await createAccount(request)


        //Send Response
        return setAuthCookies({ res, accessToken, refreshToken })
            .status(CREATED)
            .json(user)
    }
)


export const loginHandler = catchError(
    async (req, res) => {
        const request = loginSchema.parse({
            ...req.body,
            userAgent: req.headers["user-agent"]
        });

        const {accessToken, refreshToken } = await loginUser(request);

        return setAuthCookies({res, accessToken, refreshToken})
    }
) 