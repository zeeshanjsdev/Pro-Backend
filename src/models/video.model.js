import mongoose, { mongo, Schema } from "mongoose";

import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'



const videoSchema = new Schema(
  {
    videoFile: 
    {
        type: String, //cloudindary 
        require: true, 
    },
    thumbnail:
    {
        type: String, //cloudindary 
        require: true, 
    },
    title:
    {
        type: String, //cloudindary 
        require: true, 
    },
    description:
    {
        type: String, //cloudindary 
        require: true, 
    },
    duration:
    {
        type: Number, //cloudindary 
        require: true, 
    },
    views:
    {
        type: Number, //cloudindary 
        default: 0, 
    },
    isPublished:
    {
        type: Bolean, //cloudindary 
        default: 0, 
    },
    owner:
    {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema);
