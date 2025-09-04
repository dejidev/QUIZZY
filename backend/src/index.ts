import express from 'express';
import { connectToDataBase } from './config/db';
import { PORT, APP_ORIGIN } from './constants/env';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler';
import catchError from './utils/catchError';

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: APP_ORIGIN,
        credentials: true,
    })
)
app.use(cookieParser())





app.get('/', (req, res) => {
    catchError(async (req, res, next) => {
        throw new Error('This is a test error');
        return res.status(200).json({
            status: "success"
        })
    })
})

app.use(errorHandler);

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectToDataBase();
})