const { default: mongoose } = require("mongoose");

const courseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    type: String,
    mainTopic: String,
    photo: String,
    date: { type: Date, default: Date.now },
    courseCreateTye:{ type: String, default: "generated" },
    end: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false }
  });

  module.exports =  mongoose.model("Course", courseSchema);