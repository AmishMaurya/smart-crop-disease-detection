from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from PIL import Image

import json
import numpy as np
import onnxruntime as ort
import os


app = Flask(__name__)

CORS(app)


# =========================
# Model Paths
# =========================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "backend",
    "model",
    "pretrained",
    "model.onnx"
)

LABELS_PATH = os.path.join(
    BASE_DIR,
    "backend",
    "model",
    "pretrained",
    "class_names.json"
)


# =========================
# Load Class Names
# =========================

with open(LABELS_PATH, "r", encoding="utf-8") as f:
    class_names = json.load(f)


# =========================
# Load ONNX Model
# =========================

session = ort.InferenceSession(
    MODEL_PATH,
    providers=["CPUExecutionProvider"]
)

input_name = session.get_inputs()[0].name


print("CropCare AI model loaded successfully!")
print("Number of classes:", len(class_names))
print("Input name:", input_name)


# =========================
# Home Route
# =========================

@app.route("/")
def home():

    return send_from_directory(
        "..",
        "index.html"
    )
@app.route("/project.css")
def css():

    return send_from_directory(
        "..",
        "project.css"
    )


@app.route("/project.js")
def javascript():

    return send_from_directory(
        "..",
        "project.js"
    )


@app.route("/OIP.webp")
def image():

    return send_from_directory(
        "..",
        "OIP.webp"
    )


# =========================
# Prediction Route
# =========================
@app.route("/api")
def api_home():
    return jsonify({
        "status": "success",
        "message": "CropCare AI API is running"
    })
@app.route("/api/predict", methods=["POST"])
def predict():

    # Check image
    if "image" not in request.files:

        return jsonify({
            "error": "No image uploaded"
        }), 400


    image_file = request.files["image"]


    try:
        # =========================
        # Image Validation
        # =========================

        if image_file.filename == "":
            return jsonify({
                "error": "No image selected"
            }), 400

        allowed_extensions = {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        }

        filename = image_file.filename.lower()

        if not any(
            filename.endswith(ext)
            for ext in allowed_extensions
        ):
            return jsonify({
                "error": "Only JPG, JPEG, PNG and WEBP images are allowed"
            }), 400

        # =========================
        # Open Image
        # =========================

        image = Image.open(image_file).convert("RGB")

        print("Image received:", image.size)


        # =========================
        # Resize
        # =========================

        image = image.resize((224, 224))


        # =========================
        # Convert to NumPy
        # =========================

        image_array = np.array(
            image
        ).astype(np.float32) / 255.0


        # =========================
        # ImageNet Normalization
        # =========================

        mean = np.array(
            [0.485, 0.456, 0.406],
            dtype=np.float32
        )

        std = np.array(
            [0.229, 0.224, 0.225],
            dtype=np.float32
        )


        image_array = (
            image_array - mean
        ) / std


        # =========================
        # HWC → CHW
        # =========================

        image_array = np.transpose(
            image_array,
            (2, 0, 1)
        )


        # =========================
        # Add Batch Dimension
        # =========================

        image_array = np.expand_dims(
            image_array,
            axis=0
        )


        # =========================
        # Model Prediction
        # =========================

        outputs = session.run(
            None,
            {
                input_name: image_array
            }
        )


        predictions = outputs[0][0]


        # =========================
        # Softmax
        # =========================

        exp_values = np.exp(
            predictions - np.max(predictions)
        )

        probabilities = (
            exp_values /
            np.sum(exp_values)
        )


	        # =========================
        # Top 3 Predictions
        # =========================

        top_indices = np.argsort(probabilities)[::-1][:3]

        top_predictions = []

        for index in top_indices:

            raw_class = class_names[index]

            prediction_confidence = probabilities[index] * 100

            top_predictions.append({
                "raw_class": raw_class,
                "confidence": round(float(prediction_confidence), 2)
            })

        # Best prediction

        predicted_class = top_predictions[0]["raw_class"]

        confidence = top_predictions[0]["confidence"]


	# =========================
        # Convert Model Label
        # =========================

        if "_" in predicted_class:

            parts = predicted_class.split("_", 1)

            crop = parts[0]

            disease = parts[1]

        else:

            crop = "Unknown"

            disease = predicted_class


        # Convert underscores to spaces

        disease = disease.replace("_", " ")


        # Format disease name

        disease = disease.title()

                # =========================
        # Convert Model Label
        # =========================

        raw_class = predicted_class


        # Complete model-label mapping

        label_mapping = {

            "Pepper__bell___Bacterial_spot":
                ("Pepper", "Bacterial Spot"),

            "Pepper__bell___healthy":
                ("Pepper", "Healthy"),

            "Potato___Early_blight":
                ("Potato", "Early Blight"),

            "Potato___Late_blight":
                ("Potato", "Late Blight"),

            "Potato___healthy":
                ("Potato", "Healthy"),

            "Tomato_Bacterial_spot":
                ("Tomato", "Bacterial Spot"),

            "Tomato_Early_blight":
                ("Tomato", "Early Blight"),

            "Tomato_Late_blight":
                ("Tomato", "Late Blight"),

            "Tomato_Leaf_Mold":
                ("Tomato", "Leaf Mold"),

            "Tomato_Septoria_leaf_spot":
                ("Tomato", "Septoria Leaf Spot"),

            "Tomato_Spider_mites_Two_spotted_spider_mite":
                ("Tomato", "Spider Mites"),

            "Tomato__Target_Spot":
                ("Tomato", "Target Spot"),

            "Tomato__Tomato_YellowLeaf__Curl_Virus":
                ("Tomato", "Tomato Yellow Leaf Curl Virus"),

            "Tomato__Tomato_mosaic_virus":
                ("Tomato", "Tomato Mosaic Virus"),

            "Tomato_healthy":
                ("Tomato", "Healthy")
        }


        # Get clean crop and disease

        if raw_class in label_mapping:

            crop, disease = label_mapping[raw_class]

        else:

            crop = "Unknown"
            disease = raw_class


        # =========================
        # Clean Top 3 Predictions
        # =========================

        clean_predictions = []

        for prediction in top_predictions:

            raw_label = prediction["raw_class"]

            prediction_confidence = prediction["confidence"]

            if raw_label in label_mapping:

                prediction_crop, prediction_disease = label_mapping[raw_label]

            else:

                prediction_crop = "Unknown"
                prediction_disease = raw_label

            clean_predictions.append({
                "crop": prediction_crop,
                "disease": prediction_disease,
                "confidence": prediction_confidence,
                "raw_class": raw_label
            })


        # =========================
        # Response
        # =========================

        result = {

            "crop": crop,

            "disease": disease,

            "confidence": round(
                float(confidence),
                2
            ),

            "raw_class": predicted_class,

            "top_predictions": clean_predictions

        }


        print("Prediction:", result)

        return jsonify(result)


    except Exception as e:

        print("Prediction error:", str(e))

        return jsonify({

            "error": str(e)

        }), 500


# =========================
# Start Flask
# =========================

if __name__ == "__main__":

    app.run(
        debug=True
    )