import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, UNAUTHORIZED } from "../constants/http";
import VerificationCodeTypes from "../constants/verificationCodeTypes";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import appAssert from "../utils/appAsert";
import { now, ONE_DAY_MS, oneYearFromNow, thirtyDaysFromNow } from "../utils/date";
import jwt from "jsonwebtoken";
import { RefreshTokenPayload, refreshTokenSignOptions, signToken, verifyToken } from "../utils/jwt";

export type CreateAccountParams = {
    email: string;
    password: string;
    userAgent?: string;
}


export const createAccount = async (data: CreateAccountParams) => {
    //Verify existing user doesent exist
    const existingUser = await UserModel.exists({
        email: data.email,
    });
    appAssert(
        !existingUser, CONFLICT, "Email already in use"
    )



    //Create 

    const user = await UserModel.create({
        email: data.email,
        password: data.password,
    })

    const userId = user.id

    //Create verification code
    const verificationCode = await VerificationCodeModel.create({
        userId,
        type: VerificationCodeTypes.EmailVerification,
        expiresAt: oneYearFromNow()
    })

    //Send verification email


    //CREATE SESSION
    const session = await SessionModel.create({
        userId,
        userAgent: data.userAgent,
    })


    //Sign access toekn and refresh
    const refreshToken = signToken(
        { sessionId: session._id },
        refreshTokenSignOptions
    )

    const accessToken = signToken(
        {
            userId,
            sessionId: session._id
        }
    )


    //return user & tokens

    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken,
    }
}




type LoginParams = {
    email: string;
    password: string;
    userAgent?: string;
}

export const loginUser = async ({ email, password, userAgent }: LoginParams) => {
    //get user by email
    const user = await UserModel.findOne({ email });
    appAssert(user, UNAUTHORIZED, "Invalid Email or Password");

    //validate the password from the request
    const userId = user.id;
    console.log(userId)
    //create a session
    const session = await SessionModel.create({
        userId,
        userAgent,
    });

    const sessionInfo = {
        sessionId: session._id,
    }

    //Sign access toekn and refresh
    const refreshToken = signToken(
        sessionInfo,
        refreshTokenSignOptions
    )

    const accessToken = signToken(
        {
            ...sessionInfo,
            userId,
        }
    )



    //return user & token
    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken
    };
}




export const refreshUserAccessToken = async (refreshToken: string) => {
    const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
        secret: refreshTokenSignOptions.secret
    })

    appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

    const session = await SessionModel.findById(payload.sessionId)
    appAssert(session
        && session.expiresAt.getTime() > now,
        UNAUTHORIZED,
        "Session expired");


    const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS

    if (sessionNeedsRefresh) {
        session.expiresAt = thirtyDaysFromNow();
        await session.save();
    }

    const newRefreshToken = sessionNeedsRefresh ? signToken({
        sessionId: session._id
    },
        refreshTokenSignOptions) : undefined;

    const accessToken = signToken({
        userId: session.userId,
        sessionId: session._id,
    })


    return {
        accessToken,
        newRefreshToken
    }
}





export const verifyEmail = async (code: string) => {
    //get verification code
    const validCode = await VerificationCodeModel.findOne({
        _id: code,
        type: VerificationCodeTypes.EmailVerification,
        expiresAt: { $gt: new Date() }
    })

    appAssert(validCode, NOT_FOUND, "Invalid or expired verification code")

    //get user by id
    //update user to verified true
    const updatedUser = await UserModel.findByIdAndUpdate(
        validCode.userId,
        {
            verified: true,
        },
        { new: true }
    );
    console.log(updatedUser)
    console.log(validCode)
    appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to Verify Email")

    await validCode.deleteOne();

    return {
        user: updatedUser.omitPassword(),
    }
}