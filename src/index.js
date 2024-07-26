// require('dotenv').config({path})

import dotenv from 'dotenv'
import mongoose, { connect } from 'mongoose'
import { DB_NAME } from './constants.js';
import connectDB from './db/index.js';
import express from 'express'
const app = express()


dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.listen(process.env.DB_NAME || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    app.on('error', (error)=>{
        console.log('Error :', error);
        throw error
    })
    })
})
.catch((error)=>{
    console.log("Mongo db connection failed", error)
})





export {connectDB}


/*
import express from 'express'
const app = express()

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error)=>{
            console.log("ERROR :", error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`app is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.log("ERROR :", error)
        throw error
    }
})() */