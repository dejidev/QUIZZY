import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import { CONFLICT, UNAUTHORIZED } from "../constants/http";
import VerificationCodeTypes from "../constants/verificationCodeTypes";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import appAssert from "../utils/appAsert";
import { oneYearFromNow } from "../utils/date";
import jwt from "jsonwebtoken";

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

    //Create verification code
    const verificationCode = await VerificationCodeModel.create({
        userId: user._id,
        type: VerificationCodeTypes.EmailVerification,
        expiresAt: oneYearFromNow()
    })

    //Send verification email


    //CREATE SESSION
    const session = await SessionModel.create({
        userId: user._id,
        userAgent: data.userAgent,
    })


    //Sign access toekn and refresh
    const refreshToken = jwt.sign(
        { sessionId: session._id },
        JWT_REFRESH_SECRET,
        {
            audience: ["user"],
            expiresIn: "30d"
        }
    )

    const accessToken = jwt.sign(
        {
            userId: user._id,
            sessionId: session._id
        },
        JWT_SECRET,
        {
            audience: ["user"],
            expiresIn: "30d"
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
    const userId = user._id;
    //create a session
    const session = await SessionModel.create({
        userId,
        userAgent,
    });

    const sessionInfo = {
        sessionId: session._id,
    }
    //sign access token & refresh
    //Sign access toekn and refresh
    const refreshToken = jwt.sign(
        sessionInfo,
        JWT_REFRESH_SECRET,
        {
            audience: ["user"],
            expiresIn: "30d"
        }
    )

    const accessToken = jwt.sign(
        {
            ...sessionInfo,
            userId: user._id,
        },
        JWT_SECRET,
        {
            audience: ["user"],
            expiresIn: "30d"
        }
    )

    //return user & token
    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken
    };
}