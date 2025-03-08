import axios from "axios";
import { errorHandler, responseHandler } from "./responseHandler";
import { INSTA_APIPATH } from "../constants";


export class InstagramServices {
   private static token:string = 'EAAQOGd4dBrcBO0TWbMe5sfzIKdoiVpZBN9ZCs1vvMtfPKWIusLGdNFvJaRu9EQZBBigaNWrZBloUGaSgGt7VWjcCJVnEHOCNl8WUzl1rgOjQa7mvWqJ4yZCYwAm5ZCC3bFzhNFWRCtIZBh9qyQArAlFkOvvmcidC4PhstR6MslGrc075czKZC39ZBiPd07TGLrnsr2NheDDpr6NkCWHbhUWTirXdadQZDZD'
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