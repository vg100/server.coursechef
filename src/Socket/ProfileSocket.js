const User = require("../modals/userr");
const GenerativeAI = require("../Utils/GenerativeAI");


class ProfileSocket {
    static async getProfile(socket, data) {
        const profile = await User.findOne({ _id: data })
            .select('-password -resetPasswordToken -resetPasswordExpires -activityLog -__v')  // Exclude sensitive fields
            .populate('subscription')
            .populate('courses.courseId')
            .populate('achievements.badges')
            .populate('achievements.certificates.courseId');
            socket.emit("getProfileResponse", profile)
    }
    static async chat(socket, data) {
            const text = await GenerativeAI.generateText(data)
            socket.emit("ResponseQuesry", text)
    }
}

module.exports = ProfileSocket