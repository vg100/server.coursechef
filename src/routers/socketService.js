const JobSocket = require("../Socket/JobSocket")
const ProfileSocket = require("../Socket/ProfileSocket")



class SocketRoutes {
    static init(socket) {
        socket.on("RequestQuery", (data) => ProfileSocket.chat(socket, data))
        socket.on("Request[jobQuery]", (data) => JobSocket.query(socket, data))
    }
}

module.exports = SocketRoutes
