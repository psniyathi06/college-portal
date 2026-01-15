const amqp = require("amqplib");

let channel = null;
const QUEUE_NAME = "risk_updates";

async function connectRabbitMQ() {
  try {
    const url = process.env.RABBITMQ_URL || "amqp://localhost";
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log("✅ RabbitMQ connected, queue:", QUEUE_NAME);
  } catch (err) {
    console.error("❌ RabbitMQ connection error:", err.message);
    // Do not exit process, just run without RabbitMQ
    channel = null;
  }
}

function sendToQueue(message) {
  if (!channel) {
    console.error("❌ RabbitMQ channel not initialized");
    return;
  }

  channel.sendToQueue(QUEUE_NAME, Buffer.from(message), {
    persistent: true,
  });
}

module.exports = {
  connectRabbitMQ,
  sendToQueue,
};
