import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, ///cloudinary URL
      required: true,
    },
    coverImage: {
      type: String, ///cloudinary URL
    },
    watchHistroy: {
      type: Schema.type.ObjectId,
      ref: "video",
    },
    passWord: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("passWord")) next();

  this.password = bcrypt.hash(this.passWord, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (passWord) {
  return await bcrypt.compare(passWord, this.passWord);
};

userSchema.methods.generateAccessToken = function () {
  jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
