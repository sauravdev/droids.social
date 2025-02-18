import axios from "axios";
import { errorHandler, responseHandler } from "./responseHandler";
import { INSTA_APIPATH } from "../constants";
 

export class InstagramServices {

   private static token:string = 'EAAQOGd4dBrcBO7Wp0PGYZBmgZAgTjeZA3eIprB5For5PjVyKeQ9Y5jrc4otBDrqZCKQ5oaKNcMi1eDvh8IwxoYZABauAt1CTViw3C8ozkWrjN7iffq78KVpjg01nTB7EolJdlU7GOtAP6j6YyR09v0POXg5DdWZB0lc7zq9OHhMc7Uvo4dZAO8ovedVJGq9y4By4m7tThqXy8rwb2vmCZCZBOSgja5QZDZD'

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