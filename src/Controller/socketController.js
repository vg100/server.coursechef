const User = require("../modals/User");
const logger = require("../Utils/logger");

class SocketController {
  constructor(namespace,io) {
    this.io = io.of(namespace);
    this.io.on('connection', (socket) => {
      logger.info(`⚡User connected: ${socket.id}`);
      this.socket = socket;

      socket.on('userActive', (data) => this.updateUserStatus(data));
      socket.on('disconnect', () => this.updateUserStatus({ userId: this.socket.userId, active: false }));
    });
  }

  async updateUserStatus({ userId, active }) {
    if (!userId) {
      console.error('No userId provided.');
      return;
    }

    const status = active ? 'active' : 'inactive';

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { status },
        { new: true }
      );

      if (user) {
        this.socket.emit('userStatusUpdate', { _id: userId, status });
        console.log(`User ${user.mName} is now ${status}`);
      } else {
        console.error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error(`Error tracking user activity: ${error.message}`);
    }
  }
}

module.exports = SocketController;
