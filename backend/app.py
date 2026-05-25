from flask import Flask, jsonify, request
from groq import Groq

from ml.congestion_model import CongestionModel
from ml.risk_model import CollisionRiskModel
from services.celestrak import fetch_satellite_snapshot
from services.collision import build_collision_report

app = Flask(__name__)

groq_client = Groq(
    api_key="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"
)

risk_model = CollisionRiskModel()
congestion_model = CongestionModel()


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.get("/api/health")
def health_check():
    return jsonify({"status": "ok"})


@app.get("/api/satellites")
def get_satellites():
    group = request.args.get("group", "active")
    source = request.args.get("source", "demo")
    limit = int(request.args.get("limit", 60))

    satellites = fetch_satellite_snapshot(group=group, limit=limit, source=source)
    _annotate_congestion_scores(satellites)
    close_approaches = build_collision_report(satellites, risk_model)

    return jsonify(
        {
            "generated_at": satellites[0]["timestamp"] if satellites else None,
            "safe_distance_km": 2000,
            "source": source,
            "model_status": {
                "congestion_model_loaded": congestion_model.enabled,
                "collision_model": "heuristic_pair_risk",
            },
            "satellites": satellites,
            "close_approaches": close_approaches,
        }
    )


@app.post("/api/predict")
def predict_collision():
    payload = request.get_json(force=True)

    satellite1 = payload.get("satellite1", {})
    satellite2 = payload.get("satellite2", {})

    probability = risk_model.predict_pair(satellite1, satellite2)

    return jsonify({
        "collision_probability": probability
    })


@app.post("/api/recommendation")
def get_recommendation():
    satellite = request.get_json(force=True)

    recommendation = generate_ai_recommendation(satellite)

    return jsonify({
        "recommendation": recommendation
    })

def generate_ai_recommendation(satellite):
    prompt = f"""
    You are an AI orbital collision avoidance assistant.

    Satellite:
    Name: {satellite.get('name')}
    Altitude: {satellite.get('altitude')} km
    Velocity: {satellite.get('velocity')} km/s
    Risk Score: {satellite.get('risk_score')}
    Congestion Class: {satellite.get('congestion_class')}
    Local Density: {satellite.get('local_density')}

    Give one short realistic orbital maneuver recommendation.
    Keep answer under 20 words.
    """

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.4,
            max_tokens=40
        )

        return completion.choices[0].message.content.strip()

    except Exception as error:
        print("Groq Error:", error)
        return "AI orbital analysis active."

def _annotate_congestion_scores(satellites):
    for satellite in satellites:
        congestion_result = congestion_model.predict_satellite(
            {
                "altitude": satellite.get("altitude", 0.0),
                "inclination": satellite.get("inclination", 0.0),
                "eccentricity": satellite.get("eccentricity", 0.0),
                "mean_motion": satellite.get("mean_motion", 0.0),
                "local_density": satellite.get("local_density", 0),
            }
        )

        satellite["congestion_class"] = congestion_result["congestion_class"]
        satellite["congestion_probability"] = congestion_result[
            "congestion_probability"
        ]
        satellite["congestion_score"] = congestion_result["congestion_score"]
        satellite["risk_score"] = max(
            satellite.get("risk_score", 0.0),
            satellite["congestion_score"],
        )
        if (satellite["congestion_class"] >= 2 and satellite["congestion_score"] >= 0.78 and satellite.get("risk_score", 0) >= 0.72):
            satellite["is_danger"] = True
        else: satellite["is_danger"] = False
        satellite["ai_recommendation"] = None




if __name__ == "__main__":
    app.run(debug=True, port=5000)
