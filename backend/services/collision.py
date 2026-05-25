from itertools import combinations
from math import sqrt


SAFE_DISTANCE_KM = 120
MAX_CLOSE_APPROACHES = 18


def build_collision_report(satellites, risk_model):
    pair_candidates = []

    for satellite1, satellite2 in combinations(satellites, 2):
        distance = _distance_between(
            satellite1["eci_position"],
            satellite2["eci_position"],
        )

        pair_for_model_1 = {**satellite1, "distance_km": distance}
        pair_for_model_2 = {**satellite2, "distance_km": distance}
        probability = risk_model.predict_pair(pair_for_model_1, pair_for_model_2)

        pair_candidates.append(
            {
                "satellite1": satellite1,
                "satellite2": satellite2,
                "distance_km": distance,
                "collision_probability": probability,
            }
        )

    pair_candidates.sort(
        key=lambda pair: (pair["distance_km"], -pair["collision_probability"])
    )
    selected_pairs = pair_candidates[:MAX_CLOSE_APPROACHES]

    close_approaches = []
    for pair in selected_pairs:
        satellite1 = pair["satellite1"]
        satellite2 = pair["satellite2"]
        probability = pair["collision_probability"]
        distance = pair["distance_km"]

        satellite1["risk_score"] = max(satellite1["risk_score"], probability)
        satellite2["risk_score"] = max(satellite2["risk_score"], probability)
        if probability >= 0.88 or distance <= SAFE_DISTANCE_KM:
            satellite1["is_danger"] = True
            satellite2["is_danger"] = True

        close_approaches.append(
            {
                "pair": [satellite1["id"], satellite2["id"]],
                "distance_km": round(distance, 2),
                "collision_probability": probability,
            }
        )

    return close_approaches


def _distance_between(position1, position2):
    return sqrt(sum((value1 - value2) ** 2 for value1, value2 in zip(position1, position2)))
