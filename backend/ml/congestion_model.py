import os
import pickle


class CongestionModel:
    def __init__(self):
        self.enabled = False
        self.model = None

        model_path = os.path.join(
            os.path.dirname(__file__),
            "congestion_model.pkl"
        )

        if os.path.exists(model_path):
            try:
                with open(model_path, "rb") as file:
                    self.model = pickle.load(file)

                self.enabled = True

            except Exception:
                self.model = None
                self.enabled = False

    def predict_satellite(self, features):
        local_density = features.get("local_density", 0)
        altitude = features.get("altitude", 0)

        density_factor = min(local_density / 3500, 1.0)

        altitude_factor = (
            0.35 if altitude < 2000
            else 0.18 if altitude < 20000
            else 0.08
        )

        congestion_score = (
            density_factor * 0.65 +
            altitude_factor
        )

        if congestion_score >= 0.78:
            congestion_class = 2
        elif congestion_score >= 0.52:
            congestion_class = 1
        else:
            congestion_class = 0

        return {
            "congestion_class": congestion_class,
            "congestion_probability": round(congestion_score, 2),
            "congestion_score": round(congestion_score, 2),
        }