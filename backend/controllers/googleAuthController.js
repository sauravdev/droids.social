
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken' ;
import { checkIfUserExists } from './supabase.controller.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuthentication = async (req, res) => {
    
    const { token } = req.body;
    
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      const userId = payload['sub'];
      const email = payload['email'];
      const name = payload['name'] ;
      const avartar_url = payload['picture'] ;
      console.log("payload = " , payload) ;
    
      const isUserExists = await checkIfUserExists(email) ; 
      if(!isUserExists) 
      {
         const { error: signUpError, data } = await supabase.auth.signUp({
                email,
                password,
              });
        
        if (signUpError) {console.log("error" , signUpError) ; throw signUpError ;}
        console.log("creating user with email = "  ,email ) ; 
        const response = await createUserIfNotExists(email , name , avartar_url ) ; 
        console.log(response) ; 
      }
      else{
        console.log("user with this email already exists"); 
      }
      const jwtToken = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      res.json({ token: jwtToken });
    } catch (error) {
      console.error('Error verifying Google token:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
export {googleAuthentication}; 