# 🚀 AI-Powered Satellite Collision & Orbital Congestion Visualizer

An intelligent real-time orbital monitoring platform that visualizes satellites around Earth, predicts orbital congestion, detects collision risks, and generates AI-assisted maneuver recommendations.

Built using:
- React + Three.js for immersive 3D visualization
- Flask backend for orbital analytics
- AI/ML-based congestion prediction
- Real orbital telemetry from CelesTrak
- LLM-powered maneuver recommendation engine

---

# 🌍 Project Overview

With thousands of active satellites orbiting Earth, orbital congestion and collision risk have become major concerns for future space missions.

This project simulates an AI-assisted orbital traffic monitoring system capable of:

- Tracking satellites in real time
- Detecting congested orbital regions
- Predicting potential collision threats
- Visualizing orbital traffic in 3D
- Generating AI-based maneuver recommendations

The system combines:
- orbital mechanics,
- congestion analytics,
- telemetry monitoring,
- collision-risk analysis,
- and AI-assisted decision support.

---

# ✨ Features

## 🌎 Real-Time 3D Earth Visualization
- Interactive Earth rendered using Three.js
- Live orbit rendering for LEO, MEO, and GEO satellites
- Dynamic satellite motion and orbital paths

## 🛰 Satellite Traffic Monitoring
- Real-time orbital telemetry
- Satellite inspection dashboard
- Orbit classification (LEO / MEO / GEO)

## ⚠ Orbital Congestion Detection
- Congestion zone analysis
- Local orbital density estimation
- Congestion classification system:
  - Class 0 → Low
  - Class 1 → Medium
  - Class 2 → High

## ☄ Collision Risk Prediction
- Euclidean close-approach analysis
- Pairwise collision-risk estimation
- Threat visualization using danger channels

## 🤖 AI-Assisted Maneuver Recommendations
- LLM-based orbital maneuver suggestions
- AI telemetry analysis for risky satellites
- Autonomous orbital monitoring assistance

## 📊 Analytics Dashboard
- Threat timeline
- Orbital congestion map
- Collision intelligence panel
- Satellite telemetry monitoring

---

# 🧠 System Architecture

```text
Satellite Dataset / TLE Feed
            ↓
Orbital Data Processing
            ↓
Congestion Prediction Model
            ↓
Collision Risk Analysis
            ↓
Danger Satellite Detection
            ↓
AI Recommendation Engine
            ↓
3D Visualization Dashboard
```

---

# 🛰 How Congestion Detection Works

The backend analyzes:
- altitude
- orbital inclination
- eccentricity
- velocity
- mean motion
- nearby satellite density

These parameters are passed into a congestion prediction pipeline which assigns:
- congestion score
- congestion class
- orbital threat level

High-risk satellites are highlighted visually and monitored through the telemetry dashboard.

---

# 🧩 Tech Stack

## Frontend
- React.js
- Vite
- Three.js
- React Three Fiber
- Tailwind CSS
- Framer Motion
- Chart.js

## Backend
- Flask
- Python
- satellite.js
- Orbital telemetry processing

## AI / ML
- Congestion prediction system
- Collision-risk analysis engine
- Groq LLM integration for maneuver recommendations

---

# 📁 Project Structure

```text
6th-sem/
├── backend/
│   ├── app.py
│   ├── ml/
│   │   ├── congestion_model.py
│   │   └── risk_model.py
│   ├── services/
│   │   ├── celestrak.py
│   │   └── collision.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

---

# ⚙ Backend Setup

```bash
cd backend

python -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

Backend runs on:

```text
http://127.0.0.1:5000
---

# 💻 Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://127.0.0.1:5173
```

---

# 🔑 Environment Variables

Example backend `.env`

```env
GROQ_API_KEY=your_api_key_here
```

---

# 📌 Research & Educational Value

This project demonstrates:
- orbital analytics
- AI-assisted monitoring
- congestion prediction
- telemetry visualization
- collision-risk estimation
- intelligent aerospace dashboards

and serves as a practical exploration of modern space traffic management systems.

# ⭐ If you found this project interesting, consider starring the repository.
