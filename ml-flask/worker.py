import json
import pika
import redis
from model import RiskModel

import os

# Redis connection
redis_host = os.environ.get("REDIS_HOST", "localhost")
redis_client = redis.Redis(host=redis_host, port=6379, decode_responses=True)

model = RiskModel()

# RabbitMQ connection
rabbitmq_host = os.environ.get("RABBITMQ_HOST", "localhost")
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host=rabbitmq_host)
)
channel = connection.channel()

QUEUE_NAME = "risk_updates"
channel.queue_declare(queue=QUEUE_NAME, durable=True)

def callback(ch, method, properties, body):
    print("Received from RabbitMQ:", body)
    data = json.loads(body)

    rollNo = data["rollNo"]
    attendance = data["attendance"]
    marks = data["marks"]

    att_risk, marks_risks = model.calculate_risk(attendance, marks)

    key = f"risk:{rollNo}"

    redis_client.set(
        key,
        json.dumps({
            "attendance_risk": att_risk,
            "marks_risks": marks_risks  # Now a list of strings
        })
    )

    print(f"Saved to Redis => {key} = attendance_risk={att_risk}, marks_risks_count={len(marks_risks)}")

channel.basic_consume(
    queue=QUEUE_NAME,
    on_message_callback=callback,
    auto_ack=True
)

print("Worker running... Waiting for messages...")
channel.start_consuming()
