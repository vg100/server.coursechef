const User = require("../modals/userr");
const SocketController = require("./socketController");


class ProfileSocket {
    static async getProfile(socket, data) {
        const profile = await User.findOne({ _id: data })
            .select('-password -resetPasswordToken -resetPasswordExpires -activityLog -__v')  // Exclude sensitive fields
            .populate('subscription')
            .populate('courses.courseId')
            .populate('achievements.badges')
            .populate('achievements.certificates.courseId');
        console.log(profile)
        socket.emit("getProfileResponse", profile)
    }
}

module.exports = ProfileSocket