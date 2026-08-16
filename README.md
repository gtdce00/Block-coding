# Robot Mission 3D – Forest Adventure

**เดินทางในป่า • หาสมบัติ • แก้โค้ด • เปิดประตู**

เกมผจญภัย 3D แบบ Third-Person ผสม Block Coding สำหรับนักเรียนชั้น ป.4–ป.6  
ใช้ในการแข่งขันวันวิทยาศาสตร์

ผู้เล่นควบคุมหุ่นยนต์สำรวจป่า หาแสงทองจากกล่องสมบัติ แล้วเรียงบล็อกคำสั่งเพื่อปลดล็อกภารกิจ

**เล่นบนเว็บ:** [https://gtdce00.github.io/Block-coding/](https://gtdce00.github.io/Block-coding/)

โคลนมาเล่นบนเครื่อง:

```bash
git clone https://github.com/gtdce00/Block-coding.git
cd Block-coding
python server.py
```

จากนั้นเปิด `http://127.0.0.1:8080`

---

## 1. วิธีติดตั้ง

ความต้องการร่วม:

- เบราว์เซอร์ Chrome หรือ Edge / Firefox รุ่นใหม่
- **Python 3**
- เชื่อมต่ออินเทอร์เน็ตครั้งแรก เพื่อโหลด Three.js จาก CDN

### Windows

1. คัดลอกโฟลเดอร์ `robot-mission-3d` ทั้งโฟลเดอร์ไปยังคอมพิวเตอร์ที่ใช้แข่ง
2. ดับเบิลคลิก **`setup.bat`**
3. ดูไอคอน **Robot Mission 3D** ที่หน้าเดสก์ท็อป

ตัวติดตั้งจะคัดลอกเกมไปที่ `%LOCALAPPDATA%\RobotMission3D`

ถอนการติดตั้ง: ดับเบิลคลิก **`uninstall.bat`**

ตอนติดตั้ง Python ให้ติ๊ก *Add python.exe to PATH* — [ดาวน์โหลด](https://www.python.org/downloads/)

### Linux

1. คัดลอกโฟลเดอร์ `robot-mission-3d` ทั้งโฟลเดอร์ไปยังคอมพิวเตอร์ที่ใช้แข่ง
2. เปิดเทอร์มินัลในโฟลเดอร์เกม แล้วรัน:

```bash
chmod +x setup.sh start-game.sh uninstall.sh
./setup.sh
```

3. ดูไอคอน **Robot Mission 3D** ที่เดสก์ท็อป หรือเมนูแอป

ตัวติดตั้งจะคัดลอกเกมไปที่ `~/.local/share/RobotMission3D`

ถอนการติดตั้ง:

```bash
./uninstall.sh
```

ถ้า Ubuntu/Debian ยังไม่มี Python: `sudo apt install python3`

ถ้าคลิกไอคอนแล้ว GNOME ถาม *Allow Launching* ให้กดอนุญาต

เปิดเกมโดยไม่ติดตั้ง: `./start-game.sh`

---

## 2. วิธีเปิดเกม

**เล่นบนเว็บ (ไม่ต้องติดตั้ง):** เปิด [https://gtdce00.github.io/Block-coding/](https://gtdce00.github.io/Block-coding/) ด้วย Chrome หรือ Edge  
จบเกมแล้วคะแนนจะถูกส่งเข้า Google Sheets อัตโนมัติ — กระดานในเกมเก็บในเบราว์เซอร์เครื่องนั้น ถ้าต้องการอันดับกลางทั้งห้อง ให้ใช้ `python server.py` บนเครื่องโฮสต์ตามวิธีที่ 3

**ห้ามเปิด `index.html` ตรง ๆ ด้วย double-click / file://** เพราะเบราว์เซอร์จะบล็อกการโหลด JSON/โมดูล

### วิธีที่ 1: ไอคอนเดสก์ท็อป (แนะนำ)

ดับเบิลคลิกไอคอน **Robot Mission 3D** — จะเปิดเซิร์ฟเวอร์และเบราว์เซอร์ให้อัตโนมัติ  
**อย่าปิดหน้าต่างเทอร์มินัล** ขณะที่นักเรียนกำลังเล่น (หน้าต่างนั้นคือเซิร์ฟเวอร์)

### วิธีที่ 2: สคริปต์เปิดเกม

- Windows: ดับเบิลคลิก `start-game.bat`
- Linux: รัน `./start-game.sh`

### วิธีที่ 3: Python — แนะนำถ้าเล่นหลายเครื่อง (อันดับออนไลน์)

บน**เครื่องโฮสต์** (เครื่องครู / เครื่องกลาง):

```bash
cd robot-mission-3d
python server.py
```

หน้าจอจะขึ้นลิงก์ประมาณนี้:

- เครื่องนี้: `http://127.0.0.1:8080`
- เครื่องนักเรียน: `http://192.168.x.x:8080`

ให้นักเรียนเปิด Chrome ตามลิงก์เครื่องอื่น **ทุกเครื่องต้องต่อ Wi-Fi / LAN เดียวกัน**

ถ้าเครื่องอื่นเข้าไม่ได้ ให้เปิดพอร์ต **8080** ในไฟร์วอลล์

- Windows: อนุญาต Python ใน Windows Firewall (เครือข่ายส่วนตัว)
- Linux: `sudo ufw allow 8080/tcp` (ถ้าใช้ ufw)

อย่าใช้ `python -m http.server` ตอนแข่งหลายเครื่อง เพราะจะไม่มีกระดานคะแนนกลาง

### ส่งคะแนนเข้า Google Sheets

ลิงก์เว็บ [https://gtdce00.github.io/Block-coding/](https://gtdce00.github.io/Block-coding/) ส่งคะแนนเข้าชีตอัตโนมัติเมื่อจบเกม (เครื่องผู้เล่นต้องมีอินเทอร์เน็ต)

ถ้าใช้เครื่องโฮสต์ในห้องเรียน: รัน `python server.py` แล้วให้นักเรียนเข้าลิงก์ LAN — คะแนนจะถูกส่งเข้าชีตเดียวกัน

ถ้าจะเปลี่ยนไปชีตใหม่:

1. สร้าง [Google Sheet](https://sheets.google.com) ใหม่
2. **ส่วนขยาย → Apps Script** ลบโค้ดเดิม แล้ววางไฟล์ `scripts/google_sheets_apps_script.gs` ทั้งไฟล์ → Save
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. กด Authorize แล้วคัดลอก URL ที่ลงท้ายด้วย `/exec`
5. เปิดเกมด้วย `server.py` / ไอคอนเดสก์ท็อป → **ตั้งค่า** → วาง URL → **SAVE**
6. กด **ทดสอบส่งชีต** แล้วรีเฟรช Google Sheet — ควรมีแท็บ `Leaderboard` และแถว "ทดสอบระบบ"

ถ้าแก้โค้ดใน Apps Script ต้อง Deploy ใหม่เป็น **New version**

เครื่องโฮสต์ต้องออนไลน์ถึง Google — กระดานในเกมยังแชร์ผ่าน LAN ได้แม้เน็ตช้า

### วิธีที่ 4: VS Code Live Server / Node.js

ใช้ได้กับเครื่องเดียว อันดับจะอยู่ในเบราว์เซอร์เครื่องนั้นเท่านั้น

```bash
npm start
```

---

## 3. วิธีเพิ่ม 3D Asset

วางไฟล์ `.glb` หรือ `.gltf` ลงในโฟลเดอร์ที่ตรงกับประเภท เช่น

- `assets/characters/`
- `assets/props/`
- `assets/treasures/`
- `assets/buildings/`

จากนั้นแก้ path ในไฟล์เดียวเท่านั้น:

`config/assets.js`

ตัวอย่าง:

```js
player: { url: "assets/characters/robot.glb", fallback: "robot" }
```

ถ้าไฟล์หาย เกมจะใช้ Placeholder 3D อัตโนมัติ และไม่พัง

---

## 4. วิธีเปลี่ยน Robot

1. เตรียมไฟล์หุ่นยนต์ `.glb`
2. ตั้งชื่อ เช่น `robot.glb`
3. วางที่ `assets/characters/robot.glb`
4. ตรวจว่า `config/assets.js` ชี้มาที่ไฟล์นี้

หากโมเดลมี Animation ชื่อ Idle / Walk / Run ระบบจะเก็บคลิปไว้ (ตัว Placeholder มีแอนิเมชันแบบโปรแกรมอยู่แล้ว)

---

## 5. วิธีเปลี่ยน Environment

ธีมของแต่ละโลกอยู่ที่ `src/world/WorldBuilder.js` ใน `THEMES`

ตำแหน่งต้นไม้ อาคาร สมบัติ อยู่ที่ `data/levels.json`

ถ้ามีโมเดลต้นไม้/หิน/อาคารของจริง ให้ใส่ path ใน `config/assets.js` ที่ `tree`, `rock`, `building`, `tower`

---

## 6. วิธีเพิ่ม Treasure

แก้ `data/levels.json` ในโลกที่ต้องการ:

```json
{ "id": "t16", "questionId": "q017", "position": [10, 0, -12] }
```

แล้วเพิ่มโจทย์ใน `data/questions.json` ให้ `id` ตรงกับ `questionId`

---

## 7. วิธีเพิ่มคำถาม

เปิด `data/questions.json` แล้วเพิ่มอ็อบเจ็กต์ใหม่

สัญลักษณ์ในแผนที่โจทย์:

| ตัวอักษร | ความหมาย |
| --- | --- |
| `#` | กำแพง |
| `.` | ทางเดิน |
| `S` | จุดเริ่ม Robot |
| `G` | เป้าหมาย |
| `*` | Energy ที่ต้องเก็บ |
| `K` | กุญแจ |
| `D` | ประตู |
| `X` | เลเซอร์ (กระโดดข้าม) |

`startDir`: `0` ขึ้น, `1` ขวา, `2` ลง, `3` ซ้าย

ระบบตรวจคำตอบด้วยการจำลอง Robot บนตาราง ถ้าไปถึงเป้าหมายได้ถือว่าถูก (ไม่บังคับให้เหมือนเฉลยทีละบล็อก)  
ถ้าผิด เกมจะแสดงเฉลยและคำอธิบาย

---

## 8. วิธีสร้าง Coding Challenge

บล็อกที่ใช้ได้กำหนดที่ `availableBlocks` เช่น

`MOVE_FORWARD` `TURN_LEFT` `TURN_RIGHT` `REPEAT` `IF` `COLLECT` `OPEN` `JUMP`

ตัวเลือกเพิ่ม:

- `mustUse`: บังคับให้ใช้บล็อกบางชนิด เช่น Loop
- `maxBlocks`: จำกัดจำนวนบล็อกหลัก
- `collectAll`: ต้องเก็บ Energy ให้ครบ
- `startBlocks`: โค้ดตั้งต้นสำหรับโจทย์ Debug
- `hint` และ `explanation`: คำใบ้และเหตุผลทางการศึกษา

---

## 9. วิธีตั้งเวลา

เข้าเมนู **SETTINGS**

เลือก 15 / 20 / 30 / **50** / 60 นาที หรือพิมพ์นาทีเอง (1–120) แล้วกด **SAVE**

ค่าเริ่มต้นคือ **50 นาทีต่อด่าน** ใน `data/settings.json` ที่ `gameTimeMinutes`

เข้าโลกใหม่แล้วนาฬิกาเริ่มใหม่ที่ 50:00 เวลายังเดินต่อขณะทำโจทย์โค้ด การตอบผิดไม่หยุดเวลา

ถ้าเครื่องเคยเปิดเกมรุ่นเก่า อาจจำค่า 15 นาทีไว้ ให้เข้า SETTINGS เลือก 50 แล้วกด SAVE อีกครั้ง

---

## 10. วิธีเปลี่ยนคะแนน

ใน SETTINGS หรือ `data/settings.json`:

- ตอบถูก
- ตอบผิด (หักคะแนน ไม่ลด HP)
- เปิดสมบัติ
- สมบัติลับ
- คำใบ้

ไม่มีระบบเลือด และไม่มี Game Over จากการตอบผิด

---

## 11. วิธี Reset Leaderboard

เมนู SETTINGS → **RESET LEADERBOARD**

คะแนนเก็บใน LocalStorage ของเบราว์เซอร์เครื่องนั้น

---

## 12. วิธีเพิ่ม World

เพิ่มรายการใน `data/levels.json` แล้วกำหนด `key` เป็นหนึ่งใน

`forest` `desert` `valley` `volcano` `castle` `boss`

จากนั้นเพิ่มโจทย์ใน `questions.json` ให้ฟิลด์ `world` ตรงกัน

จำนวนโลกที่เล่นจริงปรับได้ใน SETTINGS (`numberOfWorlds`) หลังโลกสุดท้ายจะเข้า Final Boss

---

## 13. วิธีเพิ่มเสียง

วางไฟล์ `.mp3` / `.wav` / `.ogg` ใน `assets/sounds` และ `assets/music`  
แล้วใส่ path ใน `config/assets.js`

ถ้ายังไม่มีไฟล์เสียง เกมจะใช้เสียงสังเคราะห์จาก Web Audio API แทน และไม่เกิด Error

---

## 14. วิธีตรวจสอบ License ของ Asset

ก่อนนำโมเดลจากเว็บมาใช้ ต้องมีสิทธิ์ชัดเจน เช่น CC0, Public Domain หรือสัญญาอนุญาตที่ใช้ในเกมได้

ขั้นตอน:

1. เปิดหน้าเว็บแหล่งที่มา
2. อ่าน License
3. บันทึกชื่อผู้สร้าง URL และ License ลง `ASSET_CREDITS.md`
4. ห้ามใช้ไฟล์ที่ไม่ทราบที่มา

ชุดที่เหมาะกับเกมนี้ (ต้องดาวน์โหลดเองและตรวจ License ทุกครั้ง):

- [Kenney Modular Space Kit](https://kenney.nl) (CC0)
- [Quaternius Sci-Fi / Ultimate Space Kit](https://quaternius.com)

รายละเอียด Placeholder ในเกม ดูที่ `ASSET_CREDITS.md`

---

## การควบคุม

| ปุ่ม | หน้าที่ |
| --- | --- |
| W A S D | เดิน |
| Shift | วิ่ง |
| Space | กระโดด |
| E | โต้ตอบ / เปิดสมบัติ |
| เมาส์ขวาลาก | หมุนกล้อง |
| ลูกกลิ้งเมาส์ | ซูม |
| Esc | หยุดชั่วคราว |

---

## โครงสร้างไฟล์สำคัญ

```
robot-mission-3d/
  index.html
  config/assets.js      ← เปลี่ยนโมเดลที่นี่
  data/questions.json   ← คลังโจทย์
  data/levels.json      ← แผนที่และตำแหน่งสมบัติ
  data/settings.json    ← ค่าเริ่มต้นครู
  src/                  ← โค้ดเกมแยกโมดูล
```

เปลี่ยน Asset แล้วเกมยังใช้ระบบเดิมได้ ไม่ต้องเขียนเอนจินใหม่เมื่อเพิ่มโลกหรือสมบัติ
