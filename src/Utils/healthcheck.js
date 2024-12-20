const mongoose = require("mongoose");
const os = require("os");
const dns = require("dns");

exports.health = async (req, res, next) => {
  try {
    // Database Check (MongoDB)
    const dbStatus = await mongoose.connection.readyState;
    const dbConnected = dbStatus === 1 ? 'connected' : 'disconnected';

    const systemHealth = {
        memoryUsage: process.memoryUsage(),
        cpuUsage: os.loadavg(),
        uptime: convertUptime(os.uptime()),
        freeMemory: convertBytesToGB(os.freemem()),
        totalMemory: convertBytesToGB(os.totalmem()),
      };

    // DNS Check (Internet connectivity)
    const dnsCheck = await new Promise((resolve, reject) => {
      dns.resolve("google.com", (err) => {
        if (err) {
          reject('No internet connection detected.');
        } else {
          resolve('Internet connection is available.');
        }
      });
    });

    res.status(200).json({
      status: 'PONG',
      services: {
        database: dbConnected,
        internet: dnsCheck,
      },
      systemHealth,
    });

  } catch (error) {
    console.error(error);
    res.status(503).json({
      message: "Service Unavailable",
      status_code: 503,
      error: error.message,
    });
  }
};

function convertBytesToMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
  
  // Helper function to convert bytes to GB
  function convertBytesToGB(bytes) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
  
  // Helper function to convert uptime from seconds to days, hours, minutes
  function convertUptime(seconds) {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days} days, ${hours} hours, ${minutes} minutes`;
  }
