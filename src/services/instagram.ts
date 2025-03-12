import axios from "axios";
import { errorHandler, responseHandler } from "./responseHandler";
import { INSTA_APIPATH } from "../constants";


export class InstagramServices {
   private static token:string = 'EAAQOGd4dBrcBOZBQoM46UwdB4yeupohPMeXSsCNfX9btSoyogF48Un0KOHLyMoSTfIjq47FCx7Qv8AElBJ32USqlzStmn5gX0wHKYSW5Nc2MAx4ZAViXsTd4B5H59ehEcW0L81TKfz0J1YDUflw9RVielNXR3ZCSHT7PGtIPPo55y8vxuN2AbR1Yr0RtZCQ6aglZB4n9P6fBHWR9AjqTW9cddKkUZD'
    static async fetchLinkedAccounts(instaToken:string){
        try {
           const res = await axios.get(`${INSTA_APIPATH.BASEURL}/${INSTA_APIPATH.VERSION}/me/accounts?access_token=${this.token}`);
           return responseHandler(res)
           
        } catch (error) {
           throw errorHandler(error);
        }
     }

     static async  fetchInstaAccountID(id:number){

      try {
         const res = await axios.get(`${INSTA_APIPATH.BASEURL}/${INSTA_APIPATH.VERSION}/${id}?fields=instagram_business_account&access_token=${this.token}`);
         return responseHandler(res)
         
      } catch (error) {
         throw errorHandler(error);
      }
   }

   static async insights(instaAccId:number,userName:string){

      try {
         const res = await axios.get(`${INSTA_APIPATH.BASEURL}/${INSTA_APIPATH.VERSION}/${instaAccId}/?fields=business_discovery.username(${userName}){followers_count,media_count,media{id,like_count,comments_count}}&access_token=${this.token}`);
         return responseHandler(res)
         
      } catch (error) {
         throw errorHandler(error);
      }
   }

   static async instaReach(instaAccId:number,payload:string){

      try {
         const res = await axios.get(`${INSTA_APIPATH.BASEURL}/${INSTA_APIPATH.VERSION}/${instaAccId}/insights/reach/${payload}?&access_token=${this.token}`);
         return responseHandler(res)
         
      } catch (error) {
         throw errorHandler(error);
      }
   }

}