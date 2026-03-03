import mongoose from "mongoose"

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
    console.log("Connected to mongodb successful")
  } catch (error) {
    console.log("Error connect to mongodb: ", error)
    process.exit(1)
  }
}