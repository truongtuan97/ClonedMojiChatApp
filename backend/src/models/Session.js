import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  refreshToken: {
    type: String,
    required: true,
    unique: true
  },
  expiredAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
})

// auto delete when expired
sessionSchema.index({expiredAt: 1}, {expiredAfterSeconds: 0})

export default mongoose.model('Session', sessionSchema)