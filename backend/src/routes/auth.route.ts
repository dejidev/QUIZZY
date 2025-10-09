import { Router } from "express";
import {
    loginHandler,
    logoutHandler,
    refreshHandler,
    registerHandler,
    verifyEmailHandler
}
    from "../controllers/auth.controller";

export const authRoutes = Router();



authRoutes.post("/register", registerHandler)
authRoutes.post("/login", loginHandler)
authRoutes.post("/logout", logoutHandler)
authRoutes.post("/refresh", refreshHandler)
authRoutes.post("/email/verify/:code", verifyEmailHandler)