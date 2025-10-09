import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import { loginSchema, registerSchema, verificationCodeSchema } from "../models/auth.model";
import SessionModel from "../models/session.model";
import { createAccount, loginUser, refreshUserAccessToken, verifyEmail } from "../services/auth.service";
import appAssert from "../utils/appAsert";
import catchError from "../utils/catchError";
import { clearAuthCookies, getAccessTokenCookieOptions, setAuthCookies } from "../utils/cookies";
import { AccessTokenPayLoad, verifyToken } from "../utils/jwt";




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

        const { user, accessToken, refreshToken } = await loginUser(request);

        return setAuthCookies({ res, accessToken, refreshToken }).json(user)
    }
)



export const logoutHandler = catchError(
    async (req, res) => {
        const accessToken = req.cookies.accessToken;
        const { payload } = verifyToken<AccessTokenPayLoad>(accessToken || "");

        if (payload) {
            await SessionModel.findByIdAndDelete(payload.sessionId)
        }
        return clearAuthCookies(res).status(OK).json({
            message: "Logout Successful"
        })
    }
)




export const refreshHandler = catchError(
    async (req, res) => {
        const refreshToken = req.cookies.refreshToken as string | undefined;
        appAssert(refreshToken, UNAUTHORIZED, "Missing refresh Token")

        const { accessToken, newRefreshToken } = await refreshUserAccessToken(refreshToken);

        if (refreshToken) {
            res.cookie
        }

        return res.status(OK)
            .cookie("accessToken", accessToken, getAccessTokenCookieOptions()).json({
                message: "Aceess Token Refreshed"
            })
    })





export const verifyEmailHandler = catchError(
    async (req, res) => {
        const verificationCode = verificationCodeSchema.parse(req.params.code);

        await verifyEmail(verificationCode);

        console.log(verificationCode)

        return res.status(OK).json(
            {
                message: "Email was successfully verified"
            })
    }
)