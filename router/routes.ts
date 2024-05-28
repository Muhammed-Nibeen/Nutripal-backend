import express, { Router, Request, Response } from 'express';
import { UserController } from '../Controller/User/user';
import authMiddleware from '../middleware/authMiddleware';
 


const router: Router = express.Router();

router.post('/signup', UserController.registerUser);
router.post('/signup/verify-otp', UserController.verifyOtp)
router.post('/login', UserController.login);
router.post('/forgotpassword',UserController.forgotpass)
router.post('/forgotpassword/verifyotp',UserController.forgotverifyOtp)
router.post('/forgotpassword/changepass',UserController.changePassword)
router.post('/resendotp',UserController.resendOtp)
router.post('/bmicalculation',authMiddleware,UserController.bmiCalculation)
router.post('/showbmi',UserController.showBmi)

export const userRoute = router;


