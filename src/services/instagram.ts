import axios from "axios";
import { errorHandler, responseHandler } from "./responseHandler";
import { INSTA_APIPATH } from "../constants";


export class InstagramServices {
   private static token:string = 'EAAQOGd4dBrcBO1LE7ZBkXTaOt8umUlGYuNRtmPXaaDevjPH9UotPl9BY8wUpFrDs9ZBDnmTp0iSdKMi8Hqw66HPrd4HmfjNdYWOE4v84rF7XfgH91rrCEL66BmJ8GL7ggCZA2ZCWoh5ZCQu8m18DiEteUB6mceb49x0vRzUF51el6Wl2e3R5kEU9D5kttTzD9KiRSGZBSoo3oA4NAuTlAs51BqFJQZD'
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