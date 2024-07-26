import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credentials: true
}));

app.use(exprese.json({limit:'16kb'}));
app.use(express.urlencoded({extended: true, limit: '16kb'}));
app.use(express.static('public'));
app.use(cookieParser());

//import route

import userRouter from './routes/user.router.js'


//routes declaration

app.use('/api/v1/users', userRouter )


//http://localhost:8000/api/v1/users/register


export {app};