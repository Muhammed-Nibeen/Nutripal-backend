import {  Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { userCollection } from '../../Model/userSchema';
import bcrypt from 'bcrypt';
import { generateToken } from '../../utils/jwtToken';
import { nutriCollection } from '../../model/nutriSchema';
import { foodCollection,FoodDocument  } from '../../model/food';
import { ResponseStatus } from '../../constants/statusCodeEnums';
import { dailyIntakeCollection } from '../../model/dailyIntake';
import mongoose from 'mongoose';

export const AdminController = {

  login: asyncHandler(async (req: Request, res: Response) => {
    try{
      const {email,password} = req.body
      const admin = await userCollection.findOne({email:email,role:"Admin"})
      if(admin){
        const hashedPassword = admin.password;
        const isPasswordCorrect = await bcrypt.compare(password, hashedPassword)

        if(isPasswordCorrect){
          if(!admin.isblocked){
            const token = generateToken(admin._id,admin.role,process.env.JWT_SECRET as string)
            res.status(ResponseStatus.OK).json({message:'Login success',token,admin})
          }else{
            res.status(400).json({error:'Account is blocked'})
          }
        }else{
          res.status(400).json({error:'Incorrect password'})
        }
      }else{
        res.status(400).json({error:'Incorrect email and password'})
      }
    }catch(error){
      console.error(error)
      res.status(ResponseStatus.BadRequest).json({error:'Internal server error'})
    }
  }),

  getUsers: asyncHandler(async(req:Request,res:Response)=>{
    try{
      const page = parseInt(req.query.page as string, 10);
      const limit = parseInt(req.query.limit as string, 10);
      const skip = (page - 1) * limit;
      const users = await userCollection.find({role:'User'}).skip(skip)
      .limit(limit)
      const totalcount = await userCollection.countDocuments();
      res.status(ResponseStatus.OK).json({message:'List of users',users,totalcount})
    }
    catch(error){
      console.error(error);
      res.status(ResponseStatus.BadRequest).json({error:'Error fetching data'})
    }
  }),
  
  manageUser: asyncHandler(async(req:Request,res:Response)=>{
    try{
      console.log(req.params.id)
      const id = req.params.id
      const user = await userCollection.findById(id)
      if(!user){
        res.status(ResponseStatus.BadRequest).json({error:'No user found'})
      }else{
        user.isblocked = !user.isblocked
        await user.save();
        const updatedUser = await userCollection.findById(id)
        res.status(ResponseStatus.OK).json({message:'Updated successfully',updatedUser})
      }
    }catch(error){
      console.error(error)
      res.status(ResponseStatus.BadRequest).json({error:'Error fetching User'})
    }
  }),

  getNutris: asyncHandler(async(req:Request,res:Response)=>{
    try{
      const users = await nutriCollection.find({role:'Nutritionist'});
      res.status(ResponseStatus.OK).json({message:'List of users',users})
    }
    catch(error){
      console.error(error);
      res.status(ResponseStatus.BadRequest).json({error:'Error fetching data'})
    }
  }),

  managenutris: asyncHandler(async(req:Request,res:Response)=>{
    try{
      console.log(req.params.id)
      const id = req.params.id
      const user = await nutriCollection.findById(id)
      if(!user){
      res.status(ResponseStatus.BadRequest).json({error:'No Nutritionist found'})
      }else{
        user.isblocked = !user.isblocked
        await user.save();
        const updatedUser = await nutriCollection.findById(id)
        res.status(ResponseStatus.OK).json({message:'Updated successfully',updatedUser})
      }
    }catch(error){
      console.error(error)
      res.status(ResponseStatus.BadRequest).json({error:'Error fetching Nutritionist'})
    }
  }),

  searchUser: asyncHandler(async(req:Request,res:Response)=>{
    try{
      const searchQuery = req.body.Email
      const user = await userCollection.find({ 
        role: 'User', 
        email: { $regex: new RegExp(searchQuery, 'i') }
      });
      console.log(user)
      res.status(ResponseStatus.OK).json({message:'List of users',user})
    }catch(error){
      console.error(error);
      res.status(ResponseStatus.BadRequest).json({ error: 'No such user exist'});
    }
  }),

  addFood: asyncHandler(async(req: Request, res: Response) => {
    try {
      const foodimage = req.file?.filename;
      console.log("This is food items value",req.body); 
      const kcal = Number(req.body.kcal);
      const protein = Number(req.body.protein);
      const carbs = Number(req.body.carbs);
      const fats = Number(req.body.fats);
      console.log("Kcal is",kcal)
      const addFood={
        foodName:req.body.foodName,
        kcal: isNaN(kcal)? 0 : kcal,
        protein: isNaN(protein)? 0 : protein,
        carbs: isNaN(carbs)? 0 : carbs,
        fats: isNaN(fats)? 0 : fats,
        category:req.body.category,
        portion:req.body.portion,
        description: req.body.description,
        imageUrl:foodimage
      }
      await foodCollection.create(addFood)
     res.status(ResponseStatus.OK).json({message:'Food item added successfully'})
    } catch (error) {
      console.log(error);
      res.status(ResponseStatus.BadRequest).json({ error: 'Internal server error'});
    }
  }),
  
  dailyIntake: asyncHandler(async(req:Request,res:Response)=>{
    try{
      console.log("This is daily intake data",req.body)
      const program = req.body.program
      const calories = Number(req.body.calories);
      const protein = Number(req.body.protein);
      const carbs = Number(req.body.carbs);
      const fats = Number(req.body.fats);
      const addIntake={
        program: program,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fats: fats
      }
      await dailyIntakeCollection.create(addIntake)
      res.status(ResponseStatus.OK).json({message:'Daily Intake added successfully'})
    }catch(error){
      console.log(error)
      res.status(ResponseStatus.BadRequest).json({error:'Intenal server error'})
    }
  }),

  toogleBreakfast: asyncHandler(async(req:Request,res:Response)=>{
    try{
      let food:FoodDocument[]
      food = await foodCollection.find({category:"breakfast",portion:"light"}).limit(3)
      res.status(ResponseStatus.OK).json({message:'Food items ',food})
    }catch(error){
      console.log(error)
      res.status(ResponseStatus.BadRequest).json({error:'Intenal server error'})
    }
  }),

  toogleLunch: asyncHandler(async(req:Request,res:Response)=>{
    try{
      let food:FoodDocument[]
      food = await foodCollection.find({category:"lunch",portion:"light"}).limit(3)
      res.status(ResponseStatus.OK).json({message:'Food items ',food})
    }catch(error){
      console.log(error)
      res.status(ResponseStatus.BadRequest).json({error:'Intenal server error'})
    }
  }),

  toogleDinner: asyncHandler(async(req:Request,res:Response)=>{
    try{
      let food:FoodDocument[]
      food = await foodCollection.find({category:"dinner",portion:"light"}).limit(3)
      res.status(ResponseStatus.OK).json({message:'Food items ',food})
    }catch(error){
      console.log(error)
      res.status(ResponseStatus.BadRequest).json({error:'Intenal server error'})
    }
  }),


  updateFood: asyncHandler(async(req:Request,res:Response)=>{
    try{
      const foodIdS = req.params.id;
      const foodId = new mongoose.Types.ObjectId(foodIdS)
      console.log("This is daily intake ",req.body,foodId)
      const { foodName, kcal, protein, carbs, fats } = req.body;
      const updatedFood: Partial<FoodDocument> = {
        foodName,
        kcal,
        protein,
        carbs,
        fats,
      };
      const food = await foodCollection.findByIdAndUpdate(foodId, updatedFood, { new: true });
      if (!food) {
        res.status(ResponseStatus.BadRequest).json({error:'Update went wrong'})
      }
      res.status(ResponseStatus.OK).json({message:'Updated'})
    }catch(error){
      console.log(error)
      res.status(ResponseStatus.BadRequest).json({error:'Intenal server error'})
    }
  }),

}