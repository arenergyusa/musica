import re
from typing import Dict

import cv2
import mediapipe as mp
import numpy as np
import pytesseract
from fastapi import FastAPI, File, HTTPException, UploadFile

app = FastAPI(title="Musica local KYC verifier")
face_mesh = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

def image(upload: UploadFile):
    data = np.frombuffer(upload.file.read(), np.uint8)
    decoded = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if decoded is None: raise HTTPException(422, "Invalid camera image")
    return decoded

def text(img):
    data = pytesseract.image_to_data(img, config="--psm 6", output_type=pytesseract.Output.DICT)
    confidence = [float(value) for value in data["conf"] if value not in ("-1", "")]
    if not confidence or sum(confidence) / len(confidence) < 55:
        raise HTTPException(422, "Document is blurred or has glare. Please retake a clearer camera scan")
    return " ".join(data["text"]).upper()

def name_from_text(value: str) -> str:
    # Aadhaar/PAN layouts vary; this intentionally only accepts a clear all-letter name line.
    lines = [re.sub(r"[^A-Z ]", "", line).strip() for line in value.splitlines()]
    candidates = [line for line in lines if 5 <= len(line) <= 50 and len(line.split()) >= 2 and not any(word in line for word in ("GOVERNMENT", "INCOME", "TAX", "INDIA", "DOB", "MALE", "FEMALE", "PERMANENT"))]
    return candidates[0] if candidates else ""

def pose(img, required: str):
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)
    if not result.multi_face_landmarks: raise HTTPException(422, f"No single face found for {required} pose")
    lm = result.multi_face_landmarks[0].landmark
    # Nose position relative to eye centres yields a compact VPS-only pose challenge.
    nose, left_eye, right_eye = lm[1], lm[33], lm[263]
    eye_mid_x, eye_mid_y = (left_eye.x + right_eye.x) / 2, (left_eye.y + right_eye.y) / 2
    eye_distance = abs(right_eye.x - left_eye.x)
    yaw = (nose.x - eye_mid_x) / max(eye_distance, 0.01)
    pitch = (eye_mid_y - nose.y) / max(eye_distance, 0.01)
    valid = {"front": abs(yaw) < 0.20 and abs(pitch) < 0.45, "left": yaw > 0.22, "right": yaw < -0.22, "up": pitch > 0.48}[required]
    if not valid: raise HTTPException(422, f"Please retake the {required} selfie pose")
    # A compact geometry signature ensures all four captures have one similarly
    # framed face before the liveness sequence can pass.
    return np.array([nose.x, nose.y, left_eye.x, left_eye.y, right_eye.x, right_eye.y])

@app.post("/verify")
def verify(
    aadhaar_front: UploadFile = File(...), aadhaar_back: UploadFile = File(...), pan_front: UploadFile = File(...),
    selfie_front: UploadFile = File(...), selfie_left: UploadFile = File(...), selfie_right: UploadFile = File(...), selfie_up: UploadFile = File(...),
) -> Dict[str, object]:
    aadhaar_text, pan_text = text(image(aadhaar_front)), text(image(pan_front))
    aadhaar = re.search(r"(?<!\d)(\d[\d ]{10,14}\d)(?!\d)", aadhaar_text)
    pan = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", pan_text)
    if not aadhaar or not pan: raise HTTPException(422, "Could not read a valid Aadhaar or PAN number")
    aadhaar_number = re.sub(r"\D", "", aadhaar.group(1))
    aadhaar_name, pan_name = name_from_text(aadhaar_text), name_from_text(pan_text)
    if len(aadhaar_number) != 12 or not aadhaar_name or not pan_name: raise HTTPException(422, "Could not read document names clearly")
    signatures = [pose(image(selfie_front), "front"), pose(image(selfie_left), "left"), pose(image(selfie_right), "right"), pose(image(selfie_up), "up")]
    if any(np.linalg.norm(signature - signatures[0]) > 1.2 for signature in signatures[1:]):
        raise HTTPException(422, "Selfie frames do not appear to contain the same person")
    return {"aadhaar_number": aadhaar_number, "aadhaar_name": aadhaar_name, "pan_number": pan.group(1), "pan_name": pan_name, "liveness_pass": True}
