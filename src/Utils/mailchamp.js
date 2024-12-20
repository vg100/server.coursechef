const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const getEnvironmentVariables = require('../Environment/env');

const services = {
  godaddy: {
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
      user: "support@coursechef.in",
      pass: "Vijay.react@123",
    }
  },
  gmail: {
    host: 'smtp.gmail.com',
    port: 465,
    service: 'gmail',
    secure: true,
    auth: {
      user: getEnvironmentVariables().GMAIL.EMAIL,
      pass: getEnvironmentVariables().GMAIL.PASSWORD,
    },

  }
}

class MailServiceProvider {
  static createTransporter() {
    return nodemailer.createTransport(services["godaddy"]);
  }

  static loadTemplate(templateName, variables = {}) {
    const templatePath = path.join(__dirname, '../templates', templateName);
    let template = fs.readFileSync(templatePath, 'utf-8');
    Object.keys(variables).forEach(key => {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    });

    return template;
  }

  static async sendEmail({ from, to, subject, templateName, variables }) {
    const transporter = this.createTransporter();
    const html = this.loadTemplate(templateName, variables);

    const mailOptions = {
      from:`Coursechef.in <${from}>`,
      to,
      subject,
      html,
      replyTo: `Coursechef.in <${from}>`, 
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = MailServiceProvider;



