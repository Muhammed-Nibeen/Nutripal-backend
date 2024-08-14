import express, { Router, Request, Response } from 'express';
import { NutriController } from '../Controller/Nutri/nutri';

const router: Router = express.Router();

router.post('/signup', NutriController.registerNutri);
router.post('/signup/verify-otp', NutriController.verifyOtp)
router.post('/login',NutriController.login)
router.post('/scheduleappointment',NutriController.scheduleAppointment)
router.post('/getappointment',NutriController.getAppointment)
router.post('/getunbookedappointment',NutriController.getUnbookedAppointment)
router.post('/showuserapp',NutriController.showuserApp)
router.post('/getcount',NutriController.getCount)
router.post('/deleteappointment',NutriController.deleteAppointment)
router.post('/updateappointment',NutriController.updateAppointment)
router.post('/saveprescription',NutriController.savePrescription)
router.post('/getnamenutri',NutriController.getNameNutri)
router.post('/getnameuser',NutriController.getNameUser)
router.post('/getrevenue',NutriController.getRevenue)
router.post('/getprofile',NutriController.getProfile)
router.post('/saveprofile',NutriController.saveProfile)

export const nutriRoute = router