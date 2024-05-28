import express, { Router, Request, Response } from 'express';
import { AdminController } from '../Controller/admin/admin'
import { upload } from "../utils/multer";

const router: Router = express.Router();

router.post('/adminlogin',AdminController.login)
router.get('/getUsers',AdminController.getUsers)
router.put('/manageUsers/:id',AdminController.manageUser)
router.get('/getNutris',AdminController.getNutris)
router.put('/managenutri/:id',AdminController.managenutris)
router.post('/searchUser',AdminController.searchUser)
router.post('/addfood',upload,AdminController.addFood)

export const adminRoute = router