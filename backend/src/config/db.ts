const mongoose = require('mongoose');
import { MONGO_URI } from "../constants/env";

export const connectToDataBase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("Error connecting to MongoDB");
        console.log(error);
        process.exit(1);
    }

}