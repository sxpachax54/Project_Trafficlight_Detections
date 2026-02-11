
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from ultralytics import YOLO
import io
from PIL import Image

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

model = YOLO("best.pt") 

@app.get("/")
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    conf_thres: float = Form(0.40)
):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    results = model(image, conf=conf_thres)
    
    detections = []

    ALLOWED_CLASSES = ['Green', 'Red', 'Yellow'] 

    for result in results:
        for box in result.boxes:
            cls = int(box.cls[0])
            label = result.names[cls]
            conf = float(box.conf[0])
            
            if label in ALLOWED_CLASSES:
                coords = box.xyxy[0].tolist()
                detections.append({
                    "bbox": coords,
                    "confidence": conf,
                    "label": label
                })
            
    return JSONResponse(content={"detections": detections})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)