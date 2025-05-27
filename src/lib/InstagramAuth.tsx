import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";
import {
  BACKEND_APIPATH,
  REDIRECT_URIS,
  INSTAGRAM_CREDENTIALS,
} from "../constants";
const loginWithInstagram = () => {
  localStorage.removeItem("code");
  localStorage.removeItem("instagram_access_token");
  localStorage.removeItem("instagram_user_id");
  const authUrl = `https://www.facebook.com/v22.0/dialog/oauth
?client_id=1118799103324944
&redirect_uri=https://socialdroids.wisedroids.ai/auth/instagram
&scope=instagram_basic,instagram_content_publish
&response_type=code`;
  window.location.href = authUrl;
};
const InstagramAuth: React.FC = () => {
  const navigateTo = useNavigate();
  const [userAccessToken, setUserAccessToken] = useState<string | null>(null);
  const [instagramAccount, setInstagramAccount] = useState<any>(null);
  const [instagramCode, setInstragramCode] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const fetchAccessToken = async (code: string) => {
    try {
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/auth/instagram/token`,
        {
          headers: { "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ code }),
        }
      );

      const { access_token, ig_user_id } = await response.json();
      console.log("access_token = ", access_token);
      console.log("token response (instagram ) ", access_token);
      localStorage.setItem("instagram_access_token", access_token);
      localStorage.setItem("instagram_user_id", ig_user_id);

      if (access_token && ig_user_id) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        console.log("data = ", user);
        //  Save instagram  connection to database
        const { error: dbError } = await supabase
          .from("social_accounts")
          .insert({
            profile_id: user?.id,
            platform: "instagram",
            username: "",
            access_token: localStorage.getItem("instagram_access_token"),
            refresh_token: localStorage.getItem("instagram_access_token"),
            userId: ig_user_id,
          });

           setUserAccessToken(access_token);
      }
    } catch (error) {
      console.error("Error fetching access token:", error);
    }
  };

  // Function to fetch connected Instagram Business Account
  const fetchInstagramAccount = async () => {
    try {
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/auth/instagram/user/${localStorage.getItem(
          "instagram_access_token"
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token : localStorage.getItem(
              "instagram_access_token") ,
            ig_user_id: localStorage.getItem("instagram_user_id"),
          }),
        }
      );
      const data = await response.json();
      console.log("instagram response = ", response);
      const { username, id } = data;
      setInstagramAccount(data);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("data = ", user);
      //  Save instagram  connection to database
      const { error: dbError } = await supabase.from("social_accounts").insert({
        profile_id: user?.id,
        platform: "instagram",
        username: username,
        access_token: localStorage.getItem("instagram_access_token"),
        refresh_token: localStorage.getItem("instagram_access_token"),
        userId: id,
      });
      navigateTo("/dashboard");
      // if (dbError) throw dbError;
    } catch (error) {
      console.error("Error fetching Instagram account:", error);
    }
  };

  useEffect(() => {
    const code = searchParams.get("code");
    if (code && !localStorage.getItem("code")) {
      setInstragramCode(code);
      localStorage.setItem("code", code);
      fetchAccessToken(code);
    }
  }, [searchParams]);
  useEffect(() => {
    if (localStorage.getItem("instagram_access_token")) {
      fetchInstagramAccount();
    }
  }, [userAccessToken]);

  return <></>;
};

export { InstagramAuth, loginWithInstagram };
