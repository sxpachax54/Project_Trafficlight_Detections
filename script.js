const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const confSlider = document.getElementById('confSlider');
const confValueSpan = document.getElementById('confValue');

let isStreaming = false;

// อัปเดตตัวเลขเปอร์เซ็นต์เวลาเลื่อน Slider
function updateSlider() {
    confValueSpan.innerText = confSlider.value;
}

// 1. เปิดใช้งานกล้อง
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } // พยายามใช้กล้องหลังถ้าเป็นมือถือ
        });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            isStreaming = true;
            detectFrame();
        };
    } catch (err) {
        console.error("Error:", err);
        alert("ไม่สามารถเข้าถึงกล้องได้");
    }
}

function stopCamera() {
    isStreaming = false;
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 2. ฟังก์ชันส่งภาพและค่า Config ไปทำนาย
async function detectFrame() {
    if (!isStreaming) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCanvas.getContext('2d').drawImage(video, 0, 0);

    tempCanvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");
        
        // ส่งค่า Confidence จาก Slider ไปด้วย (หาร 100 ให้เป็น 0.4)
        formData.append("conf_thres", confSlider.value / 100);

        try {
            const response = await fetch('/predict', { method: 'POST', body: formData });
            const data = await response.json();
            drawBoxes(data.detections);
            updateStats(data.detections); // อัปเดตตัวเลขสถิติ
        } catch (err) { console.error(err); }

        requestAnimationFrame(detectFrame);
    }, 'image/jpeg');
}

// 3. จัดการอัปโหลดรูป
async function uploadImage() {
    const input = document.getElementById('uploadInput');
    if (input.files && input.files[0]) {
        stopCamera();
        const file = input.files[0];
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = async () => {
            // ปรับขนาด Canvas ให้พอดีรูป แต่ไม่ล้นจอ
            const maxWidth = window.innerWidth - 350; 
            const scale = Math.min(1, maxWidth / img.width);
            
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const formData = new FormData();
            formData.append("file", file);
            formData.append("conf_thres", confSlider.value / 100);
            
            const response = await fetch('/predict', { method: 'POST', body: formData });
            const data = await response.json();
            drawBoxes(data.detections, scale); // ส่ง scale ไปด้วยเผื่อมีการย่อรูป
            updateStats(data.detections);
        }
    }
}

// 4. วาดกรอบพร้อมสีตามประเภทไฟ
function drawBoxes(detections, scale = 1) {
    if (isStreaming) ctx.clearRect(0, 0, canvas.width, canvas.height);

    // กำหนดสีให้แต่ละ Class
    const colorMap = {
        'Red': '#ff3333',    // สีแดงนีออน
        'Green': '#00ff00',  // สีเขียวนีออน
        'Yellow': '#ffcc00'  // สีเหลืองทอง
    };

    detections.forEach(det => {
        // คูณ scale เข้าไปเผื่อกรณีรูปถูกย่อ
        const [x1, y1, x2, y2] = det.bbox.map(c => c * scale);
        const color = colorMap[det.label] || '#ffffff'; // ถ้าไม่เจอให้ใช้สีขาว

        // วาดกรอบ
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(x1, y1, x2 - x1, y2 - y1);
        ctx.stroke();

        // วาดพื้นหลังป้ายชื่อ
        ctx.fillStyle = color;
        const text = `${det.label} ${Math.round(det.confidence * 100)}%`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x1, y1 > 20 ? y1 - 25 : y1, textWidth + 10, 25);

        // เขียนตัวหนังสือ
        ctx.fillStyle = '#000000'; // ตัวหนังสือสีดำจะได้อ่านง่ายบนพื้นสี
        ctx.font = "bold 16px Kanit";
        ctx.fillText(text, x1 + 5, y1 > 20 ? y1 - 7 : y1 + 18);
    });
}

// 5. อัปเดตตารางสถิติ
function updateStats(detections) {
    // นับจำนวนแต่ละสี
    let counts = { 'Red': 0, 'Yellow': 0, 'Green': 0 };
    detections.forEach(det => {
        if (counts[det.label] !== undefined) counts[det.label]++;
    });

    // แสดงผลบนหน้าเว็บ
    document.getElementById('count-Red').innerText = counts['Red'];
    document.getElementById('count-Yellow').innerText = counts['Yellow'];
    document.getElementById('count-Green').innerText = counts['Green'];
}