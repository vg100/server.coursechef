const { default: mongoose } = require("mongoose");

const adminSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    mName: String,
    type: { type: String, required: true },
    total: { type: Number, default: 0 },
    terms: { type: String, default: '' },
    privacy: { type: String, default: '' },
    cancel: { type: String, default: '' },
    refund: { type: String, default: '' },
    billing: { type: String, default: '' }
  });


  module.exports = mongoose.model("Admin", adminSchema);