import { Router } from "express";
const router = Router();

/** import all controllers */
import * as controller from './controllers/appController.js';
import Auth,{localVariables} from "./middleware/auth.js";
import {registerMail} from './controllers/mailer.js'


//post
router.route('/register').post(controller.register)
router.route('/registermail').post(registerMail); //send the Email
router.route('/authenticate').post(controller.verifyUser,(req,res)=>res.end())  //authenticateUser
router.route('/login').post(controller.login)    //login app
//get
router.route('/user/:username').get(controller.getUser)   //user with username
router.route('/generateOTP').get(controller.verifyUser,localVariables,controller.generateOTP)     //generate random otp
router.route('/verifyOTP').get(controller.verifyOTP)       //verify generate OTP
router.route('/createResetSession').get(controller.createResetSession)   //reset all the variables

//put 
router.route('/updateuser').put(Auth,controller.updateUser)   //is use to update the user profiles
router.route('/resetPassword').put(controller.verifyUser,controller.resetPassword)  //use to reset password 


export default router;