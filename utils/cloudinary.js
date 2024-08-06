import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from 'dotenv'

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, 
  // Click 'View Credentials' below to copy your API secret
});
console.log({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY}
)

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    if(!fs.existsSync(localFilePath)){
      throw new Error("file not exists on local file path"+ localFilePath)
    }
    //upload the file on cloudinary

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    
    /// file has been uploaded successfully.
    // console.log("file is uploaded on cloudinary", response.url);
    return response;
  } catch (error) {

    console.log("Error Uploading File", error.message || error)

    if(fs.existsSync(localFilePath)){
      fs.unlinkSync(localFilePath);
    }
     // remove the locally saved file as the upload operation got failed
    return null;
  }
};

export {uploadOnCloudinary}; 