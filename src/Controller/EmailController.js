const jwt = require("jsonwebtoken");
const MailServiceProvider = require("../Utils/mailchamp");
const crypto = require("crypto");
const getEnvironmentVariables = require("../Environment/env");
class EmailController {
  constructor() {
    this.companyName = "coursechef"
    this.companyLogo = "https://coursechef.in/assets/darkLogo-C6NpI7ge.svg"
    this.baselink = getEnvironmentVariables().WEBSITE_URL
  }
  async emailVerify({ email, mName }) {
    const verificationToken = jwt.sign({ email }, 'your_secret_key', { expiresIn: '1h' });
    const link = `${this.baselink}/verify-email?token=${verificationToken}`;
    await MailServiceProvider.sendEmail({
      from: `support@coursechef.in`,
      to: email,
      subject: `verify email`,
      templateName: 'email-verify.html',
      variables: { link, name: mName, logo: this.companyLogo },
    });
    console.log("Email sent to:" + email)
  }
  async passwordReset() { }
  async subscriptionCancel() { }
  async welcome({ email, mName }) {
    await MailServiceProvider.sendEmail({
      from: `support@coursechef.in`,
      to: email,
      subject: `Welcome to CourseChef`,
      templateName: 'welcome.html',
      variables: { name: "CourseChef", mName, company: "CourseChef", websiteURL: "http://localhost:3000", logo: this.companyLogo },
    });
  }
}


module.exports = new EmailController();