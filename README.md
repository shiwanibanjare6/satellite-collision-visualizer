# Satellite Collision Visualizer

This project is structured as a clean student-friendly full-stack application:

- `frontend/`: React + Vite + Three.js + React Three Fiber + Tailwind CSS
- `backend/`: Flask API + live CelesTrak TLE fetch + collision scoring + ML integration point

## Project features

- 3D rotating Earth
- Live satellite rendering using TLE data
- Orbit path generation from `satellite.js`
- Collision distance analysis
- Risk highlighting and warning lines
- Dashboard metrics and charts
- Separate backend endpoint for ML prediction

## Folder structure

```text
6th-sem/
├── backend/
│   ├── app.py
│   ├── ml/
│   │   └── risk_model.py
│   ├── services/
│   │   ├── celestrak.py
│   │   └── collision.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## How the architecture works

1. The backend fetches TLE satellite data from CelesTrak.
2. The backend converts the latest orbit state into latitude, longitude, altitude, velocity, and ECI coordinates.
3. The backend checks every satellite pair using Euclidean distance in 3D space.
4. The backend assigns a risk score using a replaceable ML-style model.
5. The frontend requests `/api/satellites`, renders Earth in 3D, draws close-approach lines, and shows live stats.

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API runs at `http://127.0.0.1:5000`.

Endpoints:

- `GET /api/health`
- `GET /api/satellites`
- `POST /api/predict`

Example prediction payload:

```json
{
  "satellite1": { "altitude": 420, "velocity": 7.66, "distance_km": 900 },
  "satellite2": { "altitude": 538, "velocity": 7.59, "distance_km": 900 }
}
```

## Frontend setup

```bash

cd frontend
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173`.

If `npm install` fails on this Windows machine because of SSL certificate verification, use:

```bash
npm config set strict-ssl false
npm install
```

If you want, switch it back later with:

```bash
npm config set strict-ssl true
```

Optional `.env` for frontend:

```bash
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

> The system uses real-time TLE orbital data from CelesTrak to visualize satellites in 3D space. Orbital paths are generated in the frontend using `satellite.js`, while the backend computes Euclidean close-approach distance and produces collision risk scores through an ML-ready prediction module.

## Next extensions

- Replace the heuristic risk model with your trained ML model
- Add filters for satellite groups
- Add time-slider based future orbit simulation
- Add satellite search and categories
- Store close-approach history in a database
