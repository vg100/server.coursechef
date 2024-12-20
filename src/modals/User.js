const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    mName: String,
    password: String,
    type: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'offline'],
      default: 'offline'
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    
    courseCount: { type: Number, default: 0 },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  });

module.exports = mongoose.model("User", userSchema);