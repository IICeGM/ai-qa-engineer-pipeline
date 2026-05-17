// ไฟล์: continuous-feedback.js
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// ฟังก์ชันช่วยอ่านไฟล์ ถ้าไม่มีไฟล์ให้ส่งค่าว่างกลับไป
function safeReadFile(filename) {
    const filePath = path.join(__dirname, filename);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return "{}"; // คืนค่า JSON เปล่าถ้าไม่มีไฟล์
}

async function generateContinuousFeedback(testCases, defectReport, suggestedFix) {
    const prompt = `คุณคือ Principal Software Quality Engineer
หน้าที่ของคุณคือวิเคราะห์ข้อมูลทั้ง 3 ส่วนของโปรเจกต์ (Test Cases, Defect Report, Suggested Fixes) เพื่อประเมินสุขภาพรวมของระบบ และให้ Feedback เพื่อปรับปรุงกระบวนการพัฒนา (Continuous Feedback)

ข้อมูลที่ 1: ชุดการทดสอบปัจจุบัน (Test Matrices)
\`\`\`json
${testCases}
\`\`\`

ข้อมูลที่ 2: รายงานจุดอ่อนของระบบ (Defect & Flaky Report)
\`\`\`json
${defectReport}
\`\`\`

ข้อมูลที่ 3: ประวัติการซ่อมแซมโค้ด (Recent Fixes)
\`\`\`json
${suggestedFix}
\`\`\`

ข้อกำหนดผลลัพธ์ (ตอบเป็น JSON Object เท่านั้น):
{
    "system_health_score": "คะแนนความแข็งแรงของระบบ (0-100)",
    "test_matrices_optimization": {
        "redundant_tests": ["รายชื่อ Test ID ที่ซ้ำซ้อนและควรลบทิ้ง พร้อมเหตุผล"],
        "missing_coverage": ["เสนอ Test Case ใหม่ (Edge cases) ที่ AI มองว่าทีม QA ควรเขียนเพิ่มเพื่ออุดช่องโหว่"]
    },
    "code_quality_improvements": {
        "architectural_advice": "คำแนะนำเชิงโครงสร้างเพื่อไม่ให้เกิดบั๊กเดิมซ้ำๆ (ภาษาไทย)",
        "refactoring_suggestions": "เทคนิคการเขียนโค้ดฟังก์ชันนี้ให้ Clean ขึ้นและ Test ง่ายขึ้น"
    },
    "action_items_for_dev_team": ["รายการสิ่งที่ทีม Dev ต้องทำเป็นอันดับต่อไป (To-do list)"]
}`;

    try {
        console.log("   [AI Engine] กำลังรวบรวม Big Data ของระบบส่งให้ Gemini วิเคราะห์ภาพรวม...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.3, // ใช้ความสร้างสรรค์ขึ้นมานิดนึง เพื่อให้ AI เสนอไอเดียใหม่ๆ ได้ดี
            }
        });
        return response.text;
    } catch (error) {
        console.error("   [API Error] ไม่สามารถเชื่อมต่อ AI ได้:", error.message);
        throw error;
    }
}

async function runContinuousFeedbackPipeline() {
    try {
        console.log("===  [START] Step 5: Continuous Feedback Pipeline ===\n");

        console.log("1. กำลังรวบรวม Data Logs จาก Step 1-4...");
        const testCasesData = safeReadFile('test_cases.json');
        const defectReportData = safeReadFile('/Defect_Detection/ai_defect_report.json');
        const suggestedFixData = safeReadFile('/Root_Cause_Analysis/i_suggested_fix.json');

        if (testCasesData === "{}" && defectReportData === "{}") {
             console.log(" ไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์ กรุณารัน Step ก่อนหน้าให้ครบถ้วน");
             return;
        }

        console.log("2. ประมวลผลข้อมูลสำเร็จ กำลังขอ Feedback เชิงกลยุทธ์จาก AI...\n");
        const aiResponse = await generateContinuousFeedback(testCasesData, defectReportData, suggestedFixData);
        const feedback = JSON.parse(aiResponse);

        // แสดงผลลัพธ์ (Dashboard)
        console.log("==================================================");
        console.log("  รายงานการพัฒนาอย่างต่อเนื่อง (Continuous Feedback)");
        console.log("==================================================");
        
        const scorePrefix = feedback.system_health_score >= 80 ? "🟢" : feedback.system_health_score >= 50 ? "🟡" : "🔴";
        console.log(`${scorePrefix} System Health Score: ${feedback.system_health_score}/100\n`);

        console.log(" การปรับปรุงชุดทดสอบ (Optimizes Test Matrices):");
        if (feedback.test_matrices_optimization.redundant_tests.length > 0) {
            console.log("    เทสที่ซ้ำซ้อนควรนำออก:");
            feedback.test_matrices_optimization.redundant_tests.forEach(t => console.log(`      - ${t}`));
        }
        console.log("    ช่องโหว่ที่ควรเพิ่มเทส (Missing Coverage):");
        feedback.test_matrices_optimization.missing_coverage.forEach(t => console.log(`      - ${t}`));

        console.log("\n การยกระดับคุณภาพโค้ด (Improves Code Quality):");
        console.log(`    คำแนะนำเชิงโครงสร้าง: ${feedback.code_quality_improvements.architectural_advice}`);
        console.log(`    ไอเดียการ Refactor: ${feedback.code_quality_improvements.refactoring_suggestions}`);

        console.log("\n สิ่งที่ทีมพัฒนาต้องทำต่อ (Action Items):");
        feedback.action_items_for_dev_team.forEach((item, index) => console.log(`   [${index + 1}] ${item}`));
        console.log("==================================================");

        // บันทึก Report
        const reportPath = path.join(__dirname, 'continuous_feedback_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(feedback, null, 2), 'utf-8');
        
        console.log(`\n บันทึกแผนการยกระดับระบบลงไฟล์: continuous_feedback_report.json`);
        console.log("===  [END] Step 5 Pipeline Completed ===");

    } catch (err) {
        console.error(" เกิดข้อผิดพลาดในระบบ Feedback Pipeline:", err.message);
    }
}

runContinuousFeedbackPipeline();