# AI QA Engineer Pipeline

ระบบ Pipeline ทดสอบซอฟต์แวร์อัจฉริยะยุคใหม่ (Next-Gen Testing Ecosystem) ที่ขับเคลื่อนด้วย Google Gemini API โดยระบบจะทำหน้าที่แทน QA และ Developer ตั้งแต่การอ่านโค้ดเพื่อสร้างแผนทดสอบอัตโนมัติ รันเทส ดักจับบั๊กถาวร แยกแยะเทสไม่เสถียร (Flaky Tests) ตลอดจนการวิเคราะห์หาต้นตอความผิดพลาดและเสนอโค้ดแก้ไข (Auto-Patch) ครบจบใน 5 ขั้นตอนแบบ Full-Loop Feedback

---

## ฟีเจอร์เด่นของระบบ (Key Features)

* **Smarter Testing:** ไม่ต้องเขียน Test Cases เอง AI วิเคราะห์ซอร์สโค้ดแล้วคิดให้ทั้งหมด ทั้ง Happy Path, Negative และ Edge Cases
* **Faster Delivery:** ออกแบบการรันเทสแบบ Dynamic และส่งข้อมูล Log ต่อเนื่องกันเป็นทอดๆ โดยอัตโนมัติ
* **Higher Reliability:** มีสมองกลคอยคัดกรอง Flaky Tests ประเมินความแข็งแรงของระบบ (System Health Score) และแนะนำแนวทางการ Refactor โค้ดให้ Clean ยิ่งขึ้น

---

## โครงสร้างโปรเจกต์ (Project Structure)

AiQA/
├── .env                       
├── checkout.js                 
│
├── generate-test-plan.js       # Step 1: สคริปต์สั่ง AI วิเคราะห์โค้ดและสร้างแผนทดสอบ
├── test_cases.json             # [Output Step 1] แผนการทดสอบในรูปแบบ Structured JSON
│
├── intelligent-runner.js       # Step 2: สคริปต์ Test Runner รันเทสจริง
├── error_trace.json            # [Output Step 2] บันทึกหลักฐาน Error (จาก intelligent-runner)
│
├── Defect_Detection/           # [แก้] ถูกจัดเก็บในโฟลเดอร์แยกต่างหาก
│   ├── defect-detctor.js       # Step 3: สคริปต์หา Flaky Test (หมายเหตุ: ไฟล์จริงพิมพ์ชื่อ detctor)
│   ├── test_history_log.json   # ไฟล์จำลองประวัติการรันย้อนหลัง 
│   └── ai_defect_report.json   # [Output Step 3] รายงานสรุปสถานะความเสถียร
│
├── ai-root-cause-analyzer.js   # Step 4: สคริปต์ AI ชี้เป้าบรรทัดที่บั๊ก
├── ai_suggested_fix.json       # [Output Step 4] แพตช์โค้ดคำแนะนำการซ่อมแซม
│
├── continuous-feedback.js      # Step 5: สคริปต์ AI สรุปภาพรวมและประเมิน Health Score
└── feedback_report/           
    └── continuous_feedback_report.json # [Output Step 5] แผนกลยุทธ์ยกระดับคุณภาพ

เจาะลึก 5 ขั้นตอนการทำงาน (The 5-Step Pipeline)ขั้นตอนชื่อสคริปต์หน้าที่หลักสิ่งที่ได้ออกมา (Output)Step 1generate-test-plan.jsอ่านโค้ด checkout.js แล้วใช้ AI เจนเคสทดสอบตามเงื่อนไขtest_cases.jsonStep 2intelligent-runner.jsนำเคสทดสอบมารันจริง หากผลลัพธ์ไม่ตรงกับที่คิดจะคาย Error Logerror_trace.jsonStep 3ai-defect-detector.jsอ่านประวัติการรันย้อนหลังเพื่อหาจุดเสี่ยงและแยกเทสไม่เสถียรออกai_defect_report.jsonStep 4ai-root-cause-analyzer.jsนำโค้ดจริงกับ Error Log มาเทียบกันเพื่อหาบรรทัดที่พังและเขียนโค้ดแก้ai_suggested_fix.jsonStep 5continuous-feedback.jsรวบรวม Big Data ทั้งหมดมาให้คะแนนระบบและแนะวิธีเขียนโค้ดให้ดีขึ้นcontinuous_feedback_report.jsonวิธีการติดตั้งและตั้งค่า (Installation & Setup)ดาวน์โหลดโปรเจกต์ และเปิด Terminal ในโฟลเดอร์หลักติดตั้ง Dependencies ที่จำเป็น (รองรับ Node.js เวอร์ชันล่าสุด)Bashnpm install @google/genai
ตั้งค่า API Key เปิดไฟล์สคริปต์ที่มีการใช้งาน AI (generate-test-plan.js, ai-defect-detector.js, ai-root-cause-analyzer.js, continuous-feedback.js) แล้วทำการระบุ Gemini API Key ของคุณในตัวแปร:JavaScriptconst apiKey = "ใส่_API_KEY_ของคุณที่นี่";
(หมายเหตุ: หากต้องการรันเพื่อดู Flow ข้อมูลก่อน สามารถใช้โหมด Simulated หรือแบบ Mock ข้อมูลได้โดยไม่จำเป็นต้องใส่ API Key)วิธีการสั่งรันระบบ (How to Run)รันเรียงลำดับตามขั้นตอนทีละสเตป เพื่อให้เกิดการส่งต่อข้อมูลอย่างสมบูรณ์:Bash

# 1. สร้างแผนการทดสอบด้วย AI
node generate-test-plan.js

# 2. รันการทดสอบจริงกับซอร์สโค้ดเพื่อหาข้อผิดพลาด
node intelligent-runner.js

# 3. วิเคราะห์หา Flaky Test และจุดเสี่ยงจากประวัติการรัน
node ai-defect-detector.js

# 4. ให้ AI สืบสวนหาต้นตอบั๊กและพ่นโค้ดแก้ไขออกมา
node ai-root-cause-analyzer.js

# 5. สรุปคะแนนสุขภาพระบบและรับคำแนะนำเชิงกลยุทธ์
node continuous-feedback.js
ผังการไหลของข้อมูล (Data Flow)

[checkout.js] ───────(วิเคราะห์โค้ด)──────> [Step 1] ──> เจนไฟล์ ──> test_cases.json
                                                                       │
                                                                       ▼
[checkout.js] <──────(ระดมยิงเทสจริง)───── [Step 2] <──อ่านข้อมูล───────┘
                                             │
                                             ▼ (ตรวจพบเคส FAILED)
                                        error_trace.json
                                             │
                                             ▼
[checkout.js] ───────(แกะรอยหาบั๊ก)──────> [Step 4] <──เทียบหลักฐาน─────┘
                                             │
                                             ▼
                                     ai_suggested_fix.json ────────┐
                                                                   │
[test_history_log.json] ──(คัดแยก Flaky)──> [Step 3]                │
                                             │                     │
                                             ▼                     ▼
                                    ai_defect_report.json ─────> [Step 5] <──อ้างอิง (test_cases.json)
                                                                   │
                                                                   ▼
                                                    continuous_feedback_report.json (เสร็จสิ้นลูป)
