const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const getEnvironmentVariables = require("./Environment/env");
const cors = require("cors");
const router = require("./routers");
const http = require("http");
const { Server: SocketIOServer } = require("socket.io");
const socketController = require("./Controller/socketController");
const logger = require("./Utils/logger");
const { createClient } = require("redis");
const dns = require("dns");
const os = require("os");
const { health } = require("./Utils/healthcheck");

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    this.redisClient = createClient({
      password: 'rZCKDcWKvP8Wmbe5oRkBrIc4cWmnlzja',
      socket: {
        host: 'redis-10728.c264.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 10728
      }
    })
    this.setConfiguration();
    this.setRouter();
    this.error404Handler();
    this.handleErrors();
  }

  setConfiguration() {
    this.setCors();
    this.connectMongoDB();
    this.initializeSocket();
    this.initializeRedis()
  }

  setCors() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  async connectMongoDB() {
    const uri = getEnvironmentVariables().MONGODB_URI;
    try {
      await mongoose.connect(uri);
      logger.info(`Connected to database: ${mongoose.connection.name}`);
    } catch (error) {
      logger.error('Database connection error:', error.message);
    }
  }

  setRouter() {
    this.app.use('/api1', router);
    this.app.get('/api1/ping',health)
  }

  async initializeRedis() {
    try {
      await this.redisClient.connect();
      logger.info("Connected to Redis");
    } catch (error) {
      logger.error("Failed to connect to Redis:", error.message);
    }
  }

  initializeSocket() {
    new socketController("/", this.io)
  }

  handleErrors() {
    this.app.use((error, req, res, next) => {
      console.error(error.stack);
      const errorStatus = req.status || (error.response ? error.response.status : 500)
      const errorMessage = error.message || (error.response ? error.response.message : 'Internal Server Error');
      const errorObject = {
        message: errorMessage,
        status_code: errorStatus,
      };
      logger.error(errorObject);
      res.status(errorStatus).json(errorObject);
    });
  }

  error404Handler() {
    this.app.use((req, res) => {
      res.status(404).json({
        message: 'Not Found',
        status_code: 404,
      });
      logger.warn(`404 error - Not Found: ${req.originalUrl}`);
    });
  }
}

module.exports = Server;

