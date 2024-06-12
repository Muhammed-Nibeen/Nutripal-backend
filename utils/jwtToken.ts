import jwt from 'jsonwebtoken'

export const generateToken = (userId: string,userType: string,secretKey: string):string=>{
  return jwt.sign({id: userId,user_type: userType},secretKey,{
    expiresIn: '1h',
  })
}

export const generaterefreshToken = (userId: string,userType: string,secretKey: string):string=>{
  return jwt.sign({id: userId,user_type: userType},secretKey,{
    expiresIn: '10d',
  })
}
