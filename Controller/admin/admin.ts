import {  Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { userCollection } from '../../Model/userSchema';
import bcrypt from 'bcrypt';
import { generateToken } from '../../utils/jwtToken';
import { nutriCollection } from '../../model/nutriSchema';

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
            res.status(200).json({message:'Login success',token,admin})
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
      res.status(500).json({error:'Internal server error'})
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
      res.status(200).json({message:'List of users',users,totalcount})
    }
    catch(error){
      console.error(error);
      res.status(500).json({error:'Error fetching data'})
    }
  }),
  
  manageUser: asyncHandler(async(req:Request,res:Response)=>{
    try{
      console.log(req.params.id)
      const id = req.params.id
      const user = await userCollection.findById(id)
      if(!user){
        res.status(500).json({error:'No user found'})
      }else{
        user.isblocked = !user.isblocked
        await user.save();
        const updatedUser = await userCollection.findById(id)
        res.status(200).json({message:'Updated successfully',updatedUser})
      }
    }catch(error){
      console.error(error)
      res.status(500).json({error:'Error fetching User'})
    }
  }),

  getNutris: asyncHandler(async(req:Request,res:Response)=>{
    try{
      const users = await nutriCollection.find({role:'Nutritionist'});
      res.status(200).json({message:'List of users',users})
    }
    catch(error){
      console.error(error);
      res.status(500).json({error:'Error fetching data'})
    }
  }),

  managenutris: asyncHandler(async(req:Request,res:Response)=>{
    try{
      console.log(req.params.id)
      const id = req.params.id
      const user = await nutriCollection.findById(id)
      if(!user){
      res.status(500).json({error:'No Nutritionist found'})
      }else{
        user.isblocked = !user.isblocked
        await user.save();
        const updatedUser = await nutriCollection.findById(id)
        res.status(200).json({message:'Updated successfully',updatedUser})
      }
    }catch(error){
      console.error(error)
      res.status(500).json({error:'Error fetching Nutritionist'})
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
      res.status(200).json({message:'List of users',user})
    }catch(error){
      console.error(error);
      res.status(500).json({ error: 'No such user exist'});
    }
  }),

  addFood: asyncHandler(async(req: Request, res: Response) => {
    try {
      const image = req.file?.filename;
      console.log(req.body); 
      console.log(image)
   
  
     
      
  

  
    } catch (error) {
      console.log(error);
    }
  })
  

}