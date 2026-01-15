const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const connectDB = require("./utils/db");
const { connectRedis } = require("./utils/redis");
const { connectRabbitMQ } = require("./utils/rabbitmq");

// Express App
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/attendance", require("./routes/attendance"));
app.use("/marks", require("./routes/marks"));
app.use("/teacher", require("./routes/teacher"));

async function startServer() {
  await connectDB();
  await connectRedis();
  await connectRabbitMQ();

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log("🚀 Backend running on port " + port);
  });
}

startServer();

module.exports = app;
