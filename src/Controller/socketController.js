class SocketController {
  constructor() {
    if (!SocketController.instance) {
      this.io = null;  // io will be initialized later
      this.namespace = null;
      this.socket = null;
      SocketController.instance = this;
    }
    return SocketController.instance;
  }

  // Initialize with the io instance and namespace
  init(namespace, io) {
    this.io = io.of(namespace); // Using namespace here

    // Setting up socket connections for the namespace
    this.io.on("connection", (socket) => {
      console.log(`⚡ Connected to socket at namespace ${namespace}:`, socket.id);
      this.socket = socket;

      socket.on("disconnect", () => {
        console.log("❌ User disconnected from namespace:", socket.id);
      });
    });
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
}

// Export the singleton instance
module.exports = new SocketController();

