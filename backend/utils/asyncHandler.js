const asyncHandler = (cb ) => {
    return  async (req , res , next ) => {
        try{
            await  cb(req  , res , next )  ;
        }
        catch(err){
            console.log('handling error ' ,  err) ;
            res.status(err.code || 500).json({
                success : false , 
                message : err.message
            })
        }
    } 
}
export {asyncHandler}   ;
