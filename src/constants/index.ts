export const INSTA_APIPATH = { 
    BASEURL: import.meta.env.VITE_INSTA_BACKEND_URL,
    VERSION : import.meta.env.VITE_FB_GRAPH_VERSION 
}

export const BACKEND_APIPATH = {
    BASEURL : import.meta.env.VITE_BACKEND_URL,
}
export const PYTHON_SERVER_URI = {
    BASEURL :  import.meta.env.VITE_PYTHON_SERVER_URI
}

export const FRONTEND_URI = {
    BASEURL : import.meta.env.VITE_FRONTEND_URI
} 

export const REDIRECT_URIS = {
    INSTAGRAM : import.meta.env.VITE_INSTAGRAM_REDIRECT_URI,
    LINKEDIN : import.meta.env.VITE_LINKEDIN_REDIRECT_URI,
    TWITTER : import.meta.env.VITE_TWITTER_REDIRECT_URI
}

export const STRIPE_KEYS={
    PUBLISH_KEY : import.meta.env.VITE_STRIPE_PUBLISH_KEY
}

export const  TWITTER_CREDENTIALS = {
    TWITTER_CLIENT_ID :  import.meta.env.VITE_TWITTER_CLIENT_ID
}

export const LINKEDIN_CREDENTIALS = {
    LINKEDIN_CLIENT_ID : import.meta.env.VITE_LINKEDIN_CLIENT_ID
}
export const INSTAGRAM_CREDENTIALS = {
    INSTAGRAM_CLIENT_ID : import.meta.env.VITE_INSTAGRAM_CLIENT_ID
}