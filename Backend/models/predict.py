import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import sys
import json
import numpy as np
from tensorflow import keras
from PIL import Image

# Load model
model_path = os.path.join(os.path.dirname(__file__), 'best_model.keras')
model = keras.models.load_model(model_path)

# Load class names
class_names_path = os.path.join(os.path.dirname(__file__), 'class_names.json')
try:
    with open(class_names_path, 'r') as f:
        class_names = json.load(f)
    if isinstance(class_names, list):
        class_mapping = {str(i): name for i, name in enumerate(class_names)}
    else:
        class_mapping = class_names
except:
    class_mapping = {str(i): f"class_{i}" for i in range(22)}

# Load fish info
info_path = os.path.join(os.path.dirname(__file__), 'fish_info.json')
try:
    with open(info_path, 'r') as f:
        fish_info = json.load(f)
except:
    fish_info = {}

if __name__ == "__main__":
    try:
        if len(sys.argv) > 2 and sys.argv[1] == "image":
            image_path = sys.argv[2]
            expected_shape = model.input_shape

            if len(expected_shape) == 4:
                height, width, channels = expected_shape[1], expected_shape[2], expected_shape[3]

                image = Image.open(image_path)
                if channels == 1:
                    image = image.convert('L')
                else:
                    image = image.convert('RGB')

                image = image.resize((width, height))
                input_data = np.array(image).reshape(1, height, width, channels).astype(np.float32)
                input_data = input_data / 255.0
            else:
                raise ValueError("Model is not an image model")
        else:
            features = json.loads(sys.argv[1])
            expected_shape = model.input_shape

            if len(expected_shape) == 4:
                height, width, channels = expected_shape[1], expected_shape[2], expected_shape[3]
                input_data = np.random.random((1, height, width, channels)).astype(np.float32)
            else:
                input_data = np.array(features).reshape(1, -1).astype(np.float32)

        prediction = model.predict(input_data, verbose=0)[0]

        predicted_class_idx = np.argmax(prediction)
        predicted_prob = prediction[predicted_class_idx]
        predicted_label = class_mapping.get(str(predicted_class_idx), f"class_{predicted_class_idx}")

        top_3_indices = np.argsort(prediction)[-3:][::-1]
        top_3_predictions = []
        for idx in top_3_indices:
            top_3_predictions.append({
                "class": class_mapping.get(str(idx), f"class_{idx}"),
                "confidence": float(prediction[idx])
            })

        # Get extra info if available
        extra_info = fish_info.get(predicted_label, {
            "nama_indonesia": "Tidak diketahui",
            "habitat": "Tidak diketahui",
            "konsumsi": "Tidak diketahui"
        })

        result = {
            "predicted_class": predicted_label,
            "confidence": float(predicted_prob),
            "top_3_predictions": top_3_predictions,
            "status": "success",
            "model_type": "image" if len(model.input_shape) == 4 else "tabular",
            "info": extra_info  # ✅ tambahkan info
        }

        print(json.dumps(result))

    except Exception as e:
        error_result = {
            "error": str(e),
            "status": "error"
        }
        print(json.dumps(error_result))
        sys.exit(1)
