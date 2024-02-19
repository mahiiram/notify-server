import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import router from './router.js';
import dotenv from 'dotenv';
const env=dotenv.config()
const app = express();

/** middlewares */
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('tiny'));
app.disable('x-powered-by'); // less hackers know about our stack



/** HTTP GET Request */
app.get('/', (req, res) => {
    res.status(201).json("Home GET Request");
});


/** api routes */
app.use('/api',router )

/** start server only when we have valid connection */
const port= process.env.PORT || 5000;
app.listen(port,() => {
    console.log('server started', port); 
})
mongoose.set('strictQuery',false)
mongoose.connect(process.env.Mongodb_url).then(()=>{
    console.log("DB connected")
}).catch((err)=>{ 
    console.log(err)
})