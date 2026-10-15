import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name : string,
    email : string,
    password : string
  },
  {timestamps: true}
)

const User = await mongoose.model("User", userSchema)
export default User