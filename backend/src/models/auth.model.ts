import { z } from "zod";


const emailSchema = z.string().email().min(5).max(25)
const passwordSchema = z.string().min(6).max(256)



export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    userAgent: z.string().optional()
})



export const registerSchema = loginSchema
    .extend({
        confirmPassword: z.string().min(6).max(256),
    })
    .refine(
        (data) => data.password === data.confirmPassword, {
        message: "Passwordds do not match",
        path: ["confirmPassword"]
    })



    

export const verificationCodeSchema = z.string().min(1).max(24)