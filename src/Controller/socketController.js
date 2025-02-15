
const SocketRoutes = require("../routers/socketService");
class SocketController {
  constructor() {
    if (!SocketController.instance) {
      this.io = null;  // io will be initialized later
      this.namespace = null;
      this.socket = null;
      this.userSocketMap = new Map();
      SocketController.instance = this;
    }
    return SocketController.instance;
  }

  // Initialize with the io instance and namespace
  init(namespace, io) {
    if (!this.io) {
      this.io = io.of(namespace); // Using namespace here

      // Setting up socket connections for the namespace
      this.io.on("connection", (socket) => {
        const { userId } = socket.handshake.query;
        if (userId) {
          this.userSocketMap.set(userId, socket.id); // Store userId -> socketId mapping
        }

        SocketRoutes.init(socket);

        console.log(`⚡ Connected to socket at namespace ${namespace}:`, socket.id);

        // Handle disconnection and clean up userSocketMap
        socket.on("disconnect", () => {
          this.userSocketMap.delete(userId);  // Clean up the map when the user disconnects
          console.log("❌ User disconnected from namespace:", socket.id);
        });
      });
    }
  }

  // Emit events to the socket at the specified namespace
  emitEvent(eventName, data) {
    if (this.io) {
      this.io.emit(eventName, data);
      console.log(`Emitting ${eventName} event with data:`, data);
    } else {
      console.warn("⚠ No active socket connection in namespace");
    }
  }

  on(eventName, callback) {
    if (this.io) {
      this.io.on(eventName, callback);
      console.log(`Listening for ${eventName} event`);
    } else {
      console.warn("⚠ No active socket connection in namespace to listen for events");
    }
  }

  to(userIds, eventName, data) {
    if (this.io) {
      if (Array.isArray(userIds)) {
        userIds.forEach(userId => {
          const socketId = this.userSocketMap.get(userId); // Get socketId for each user

          if (socketId) {
            this.io.to(socketId).emit(eventName, data);  // Emit to specific user
            console.log(`Emitting ${eventName} event to user ${userId} with data:`, data);
          } else {
            console.warn(`⚠ User ${userId} not connected`);
          }
        });
      } else {
        const socketId = this.userSocketMap.get(userIds);  // Get socketId for the user
        if (socketId) {
          this.io.to(socketId).emit(eventName, data);
        }
      }

    } else {
      console.warn("⚠ No active socket connection in namespace");
    }

  }
}

module.exports = new SocketController();

