const User = require("../modals/User");

class UserController {
  static async getProfile(req, res, next) {
    const { email, mName, password, uid } = req.body;
    try {
      const updateData = { email, mName };
      if (password) {
        updateData.password = password;
      }

      const result = await User.findOneAndUpdate(
        { _id: uid },
        { $set: updateData },
        { new: true }
      );

      if (!result) {
        throw new Error('User not found');
      }
      res.json({ success: true, message: 'Profile Updated' });
    } catch (error) {
        next(error);
    }
  }
}

module.exports = UserController;
