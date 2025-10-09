import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date";

export const REFRESHPATH = "/auth/refresh"
const secure = process.env.NODE_ENV !== "development";

// Default cookie settings
const defaults: CookieOptions = {
    sameSite: "strict",
    httpOnly: true,
    secure,
};

// Access token cookie options
export const getAccessTokenCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: fifteenMinutesFromNow(),
    path: REFRESHPATH,
});

// Refresh token cookie options
export const getRefreshTokenCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: thirtyDaysFromNow(),
});

type Params = {
    res: Response;
    accessToken: string;
    refreshToken: string;
};

export const setAuthCookies = ({
    res,
    accessToken,
    refreshToken,
}: Params) =>
    res
        .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
        .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());


export const clearAuthCookies = (res: Response) =>
    res
        .clearCookie("accessToken", { path: REFRESHPATH })
        .clearCookie("refreshToken", { path: "/" });
