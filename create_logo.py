from PIL import Image, ImageDraw

def create_app_icon():
    # กำหนดขนาดภาพ (512x512 pixel สำหรับ PWA/iOS)
    size = 512
    # สีพื้นหลัง (Dark Blue Theme แบบเดียวกับแอป)
    bg_color = (26, 26, 46) 
    # สีตัวไฟจราจร
    housing_color = (20, 20, 20)
    
    # สร้างภาพพื้นหลัง
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    # วาดตัวกรอบไฟจราจร (สี่เหลี่ยมมนๆ ตรงกลาง)
    w, h = 180, 400
    x = (size - w) // 2
    y = (size - h) // 2
    draw.rectangle([x, y, x + w, y + h], fill=housing_color, outline=None)
    
    # วาดไฟ 3 ดวง (แดง เหลือง เขียว)
    light_radius = 50
    gap = 20
    colors = [(255, 59, 48), (255, 204, 0), (52, 199, 89)] # สีแบบ iOS
    
    # ตำแหน่งไฟดวงบนสุด
    start_y = y + gap + 10
    
    for i, color in enumerate(colors):
        # ตำแหน่งจุดศูนย์กลางของไฟแต่ละดวง
        circle_x = size // 2
        circle_y = start_y + light_radius + (i * (light_radius * 2 + gap))
        
        # วาดวงกลม
        draw.ellipse(
            [circle_x - light_radius, circle_y - light_radius, 
             circle_x + light_radius, circle_y + light_radius],
            fill=color,
            outline=(50, 50, 50),
            width=2
        )
        
        # เพิ่มเงาสะท้อน (Glossy) ให้ดูมีมิติ
        highlight_offset = 15
        highlight_size = 12
        draw.ellipse(
            [circle_x - highlight_offset, circle_y - highlight_offset - 10, 
             circle_x - highlight_offset + highlight_size, circle_y - highlight_offset - 10 + highlight_size],
            fill=(255, 255, 255, 180) # สีขาวจางๆ
        )

    # บันทึกไฟล์ไปที่โฟลเดอร์ static
    import os
    if not os.path.exists('static'):
        os.makedirs('static')
        
    img.save('static/logo.png', quality=100)
    print("✅ สร้างไฟล์ static/logo.png เรียบร้อยแล้ว!")

if __name__ == "__main__":
    create_app_icon()