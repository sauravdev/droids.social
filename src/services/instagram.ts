import axios from "axios";
import { errorHandler, responseHandler } from "./responseHandler";
import { INSTA_APIPATH } from "../constants";


export class InstagramServices {
   private static token:string = 'EAAQOGd4dBrcBOZCHEsAqZBpusiDUlsAMDR7R6u1mjp2ZAg2vrjeaLwBp7kBtjrdfrvX3hdceANIHZBZAMpw7A2x9o5kT31ZAvNZCsIjZCx1xlSyZAx090BnxOZBNtQuB53YNZCD8WuJb6gHX7pn50uROOvJG1q3YXtF1KKq0r1v4ply9BlUSZAHmACQUPYn7ytW815H9Mrlz2Gznr86yIsXUH4uZADf423gZDZD'
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