import dotenv from "dotenv";
import mongoose, { connect } from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// require('dotenv').config({path})

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
      app.on("error", (error) => {
        console.log("Error :", error);
        throw error;
      });
    });
  })
  .catch((error) => {
    console.log("Mongo db connection failed", error);
  });

export { connectDB };
