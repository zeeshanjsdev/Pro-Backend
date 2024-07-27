import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from "../../utils/apiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../../utils/cloudinary.js'

const registerUser = asyncHandler(async (req, res) => {
  //     Registering User Logic
  // 1. get user details form frontend or Postman.
  // 2. Validation - not empty
  // 3. check if user already registered(by username or email).
  // 4. check for images - check for avatr.
  // 5. upload them to clodinary - avatar.
  // 8. create a user object - create entry in db.
  // 9. remove password and refresh token field from response.
  // 10. check for user creation.
  // 11. return response

  const { fullname, email, username, password } = req.body;
  console.log("email: ", email);

  //other method using array

  if ([fullname, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All field are required");
  }

  const existedUser = User.findOne(
    {
        $or: [{ username }, { email }]
    }
)

if (existedUser) {
    throw new ApiError ( 409 ,"User with email or password exists" )
}

const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if (avatarLocalPath) {
    throw new ApiError(400, 'avatar file is requried')
}
});



// one method
// if (fullname === '') {
//     throw new ApiError(400, "full name is required")
// } else {

// }
// });

export { registerUser };
