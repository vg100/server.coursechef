const ProfileSocket = require("./ProfileSocket")



class SocketRoutes {
    static init(socket) {

        socket.on("getProfileRequest", (data)=>ProfileSocket.getProfile(socket,data))
        // socket.on("updateProfileRequest", ProfileController.getProfile)
        // socket.on("deleteProfileRequest", ProfileController.getProfile)
        // socket.on("createProfileRequest", ProfileController.getProfile)


    }
}

module.exports = SocketRoutes


