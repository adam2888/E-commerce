import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import client from './db.js';
import bcrypt from 'bcrypt';

passport.use(new LocalStrategy(
  
  async (username, password,done) => {
    
   try{
    
     const result = await client.query('SELECT * from Users Where username = $1',[username])


     if (result.rows.length === 0) {
      return done(null, false, { message: 'Incorrect Username or Password' });
    }


     const user = result.rows[0];
   if(!user){
     return done(null,false,{message:'Incorrect Username or Password'})
   }
 
   const isMatch = await bcrypt.compare(password,user.password);
   if(!isMatch){
     return done(null,false,{message:'Incorrect Username or Password'})
   }
   return done(null,user)
   } catch (error) {
     return done(error)
   }
  }
 ))

 passport.serializeUser((user,done) => {
  done(null,user.id)
 })

 passport.deserializeUser(async (id,done) => {
  try{
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id])
    const user = result.rows[0];
    done(null,user);
  } catch (error){
  done(error); // Passport does not expect a return. 
  }
 })




 export default passport; // will export the passport object. This will include all functions that use passport.

