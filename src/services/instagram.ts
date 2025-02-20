import axios from "axios";
import { errorHandler, responseHandler } from "./responseHandler";
import { INSTA_APIPATH } from "../constants";
 

export class InstagramServices {

   private static token:string = 'EAAQOGd4dBrcBO3Nol3FWZByLrO48mJsJsyZBj40mTSh8wZCrl8UFV1vOYDKrpUhBaNLSoqw33CXKI0Th2ISbI3sv3ZBpaPmQFqNIt1J7vAEHmZAvxZA52dvK66GaQRYsJ1aIt1ZA1pjqSytTnZBVEEp7SOimBz1F9VIeHd0dlOZCh48Fzl8aDCmWNZB7SCSZBbISiJ3Qzlz5ZCNol5LVSfMXnnbMfAplrwZDZD'
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