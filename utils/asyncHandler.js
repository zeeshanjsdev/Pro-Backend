const asynHadler = (reqHandler) => {
    Promise.resolve(reqHandler(req, res, next)).catch((error)=>next(error));
    Promise.reject
};

export { asynHadler };

const asyncHandler =  (fn) => async (req, res, next) =>{
      try {
        await fn(req, res , next)
      } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
      }
}



// const asyncHandler =  (fn) => async (req, res, next) =>{
//       try {
//         await fn(req, res , next)
//       } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//       }
// }