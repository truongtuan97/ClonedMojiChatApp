import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  hashedPassword: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  avatarUrl: {
    type: String, //Link CDN to display image
  },
  avatarId: {
    type: String, //Cloudinary public id use to delete image on Cloud
  },
  bio: {
    type: String,
    maxlength: 500, // just option we can extend or reduce
  },
  phone: {
    type: String,
    sparse: true, // allow null, but unique if value exist
  }
},
{
  timestamps: true,
})

const User = mongoose.model("User", userSchema)
export default User