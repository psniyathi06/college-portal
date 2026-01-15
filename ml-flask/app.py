from flask import Flask, request, jsonify
from model import RiskModel

app = Flask(__name__)
model = RiskModel()

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json or {}

    attendance = data.get("attendance_percent", 0)
    marks = data.get("avg_marks", 0)

    risk_score = model.predict_risk(attendance, marks)

    return jsonify({
        "risk_score": risk_score
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
