const Admin = require("../modals/Admin");
const Contact = require("../modals/Contact");

class InfoController {
  static async getPolicies(req, res, next) {
    try {
      const admins = await Admin.find({});
      res.json(admins);
    } catch (error) {
      next(error)
    }
  }

  static async getContacts(req, res, next) {
    try {
      const contacts = await Contact.find({});
      res.json(contacts);
    } catch (error) {
      next(error)
    }
  }
}

module.exports = InfoController