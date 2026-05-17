// ไฟล์: ai-root-cause-analyzer.js
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

async function analyzeRootCauseWithAI(sourceCode, errorLog) {
    const prompt = `คุณคือ Senior Software Engineer และผู้เชี่ยวชาญด้าน Software Debugging 
หน้าที่ของคุณคือวิเคราะห์ซอร์สโค้ด (Source Code) ร่วมกับประวัติการพังของเทส (Error Log) เพื่อหา "สาเหตุที่แท้จริง (Root Cause)" ที่ทำให้ Test Case ไม่ผ่าน และส่งมอบ "โค้ดแก้ไข (Suggested Fix)" มาให้

Source Code ปัจจุบันของระบบ:
\`\`\`javascript
${sourceCode}
\`\`\`

Error Log หรือร่องรอยความผิดพลาดที่เกิดขึ้นจริง:
\`\`\`json
${errorLog}
\`\`\`

ข้อกำหนดผลลัพธ์ (คุณต้องตอบกลับเป็น JSON Object ตาม Schema นี้เท่านั้น ห้ามมีคำอธิบายภายนอก JSON):
{
    "analyzed_test_id": "ระบุรหัส Test Case ที่พัง (เช่น TC_006)",
    "root_cause_explanation": "อธิบายสาเหตุที่ตรรกะโค้ดพังเป็นภาษาไทยอย่างละเอียดเชิงลึก",
    "buggy_code_snippet": "ก๊อปปี้โค้ดบรรทัดเดิมส่วนที่มีปัญหาออกมา",
    "suggested_code_fix": "เขียนโค้ดบรรทัดที่แก้ไขและถูกต้องสมบูรณ์แบบเพื่อนำไปเปลี่ยนแทนที่",
    "confidence_score": 95
}`;

    try {
        console.log("   [AI Engine] กำลังส่ง Source Code และ Error Trace ให้ Gemini วิเคราะห์หาต้นตอ...");
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // บังคับโหมดการตอบกลับเป็น JSON
                responseMimeType: "application/json",
                // ใช้ Temperature ต่ำเพื่อให้ตรรกะการแก้โค้ดมีความแม่นยำสูงสุด
                temperature: 0.1, 
            }
        });

        return response.text;
    } catch (error) {
        console.error("   [API Error] ไม่สามารถส่งข้อมูลให้ AI ได้:", error.message);
        throw error;
    }
}

async function runAIRootCauseAnalysis() {
    try {
        console.log("===  [START] Step 4: AI Root Cause Analysis Pipeline ===\n");

        // 1. ตรวจสอบและอ่านไฟล์ซอร์สโค้ดเป้าหมาย (checkout.js)
        const targetPath = path.join(__dirname, '../checkout.js');
        if (!fs.existsSync(targetPath)) {
            console.error(" ไม่พบไฟล์ checkout.js ในระบบ");
            return;
        }
        const sourceCode = fs.readFileSync(targetPath, 'utf-8');

        // 2. ตรวจสอบและอ่านไฟล์ Error Log จาก Step 2 (error_trace.json)
        const errorLogPath = path.join(__dirname, 'error_trace.json');
        if (!fs.existsSync(errorLogPath)) {
            console.log(" [INFO] ไม่พบไฟล์ error_trace.json ในระบบ!");
            console.log("   แสดงว่าระบบทำงานสมบูรณ์ดี ไม่มีเทสตัวไหนพัง จึงไม่จำเป็นต้องใช้ AI วิเคราะห์หาบั๊ก");
            return;
        }
        const errorLog = fs.readFileSync(errorLogPath, 'utf-8');

        console.log("1. โหลดข้อมูลซอร์สโค้ดและหลักฐาน Error เข้าสู่ระบบสำเร็จ");

        // 3. เรียกใช้งานสมองกล AI เพื่อทำเลเซอร์ชี้เป้าแก้บั๊ก
        const aiResponse = await analyzeRootCauseWithAI(sourceCode, errorLog);
        const report = JSON.parse(aiResponse);

        // 4. สรุปรายงานการสืบสวนคดีบั๊กออกทาง Console
        console.log("\n==================================================");
        console.log("  รายงานจาก AI: การวิเคราะห์สาเหตุ (Root Cause Report)");
        console.log("==================================================");
        console.log(` Test Case ที่เกิดปัญหา : [${report.analyzed_test_id}]`);
        console.log(` คำอธิบายสาเหตุเชิงลึก  : ${report.root_cause_explanation}\n`);
        
        console.log(" โค้ดส่วนที่มีปัญหา (Buggy Code Snippet):");
        console.log(`--------------------------------------------------`);
        console.log(report.buggy_code_snippet);
        console.log(`--------------------------------------------------\n`);
        console.log(" โค้ดที่ AI แนะนำให้แก้ไข (Suggested Fix):");
        console.log(`--------------------------------------------------`);
        console.log(report.suggested_code_fix);
        console.log(`--------------------------------------------------\n`);
        
        console.log(` ความมั่นใจในการแก้บั๊กของ AI: ${report.confidence_score}%`);
        console.log("==================================================");

        // 5. บันทึกแพตช์คำแนะนำการแก้ไขลงไฟล์ภายนอกเพื่อให้ระบบอื่นเอาไป Auto-patch ได้
        const fixReportPath = path.join(__dirname, 'ai_suggested_fix.json');
        fs.writeFileSync(fixReportPath, JSON.stringify(report, null, 2), 'utf-8');
        
        console.log(`\n บันทึกแผนการซ่อมแซมโค้ดจาก AI ลงไฟล์: ai_suggested_fix.json`);
        console.log("===  [END] Step 4 Pipeline Completed ===");

    } catch (err) {
        console.error(" เกิดข้อผิดพลาดในระบบ RCA Pipeline:", err.message);
    }
}

// สั่งรันโปรแกรม
runAIRootCauseAnalysis();