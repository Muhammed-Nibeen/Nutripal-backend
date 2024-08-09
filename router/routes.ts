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
router.post('/displayfood',UserController.displayFood)
router.post('/displaylunch',UserController.displayLunch)
router.post('/displaydinner',UserController.displayDinner)
router.post('/getnutris',UserController.getNutris)
router.post('/bookappointment',UserController.bookAppointment)
router.post('/refreshtoken',UserController.refreshToken)
router.get('/getuser/:userid',UserController.getUser)
router.post('/getmessages',UserController.getMessage)
router.post('/getprofile',authMiddleware,UserController.getProfile)
router.post('/getbookednutris',UserController.bookedNutris)
router.post('/saveprofile',UserController.saveProfile)
router.post('/startdiet',UserController.startDiet)
router.post('/userprogress',UserController.userProgress)
router.post('/trackprogress',UserController.trackProgress)
router.post('/getbookings',UserController.getBookings)
router.post('/generatepdf',UserController.generatePdf)
router.post('/getAvailableSlots',UserController.getavailableslots)
router.post('/getnutriprofile',UserController.getNutriProfile)

export const userRoute = router;


