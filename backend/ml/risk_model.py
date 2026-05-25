class CollisionRiskModel:
    """Simple replaceable risk model.

    This heuristic lets you demo the ML integration path now.
    Later you can swap `predict_pair` with a real trained model.
    """

    def predict_pair(self, satellite1, satellite2):
        distance = satellite1.get("distance_km", satellite2.get("distance_km", 2000))
        relative_velocity = abs(
            satellite1.get("velocity", 0) - satellite2.get("velocity", 0)
        )
        altitude_gap = abs(
            satellite1.get("altitude", 0) - satellite2.get("altitude", 0)
        )

        distance_score = max(0.0, 1 - min(distance, 2000) / 2000)
        velocity_score = min(relative_velocity / 4, 1.0)
        altitude_score = max(0.0, 1 - min(altitude_gap, 800) / 800)

        probability = (
            0.55 * distance_score + 0.25 * altitude_score + 0.20 * velocity_score
        )
        return round(min(max(probability, 0.01), 0.99), 2)
