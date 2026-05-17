const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// โหลดตัวแปรจากไฟล์ .env 
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

async function analyzeLogsWithAI(historyData) {
    const prompt = `คุณคือ AI QA Data Scientist ผู้เชี่ยวชาญด้านการวิเคราะห์ผลการทดสอบระบบ
หน้าที่ของคุณคือวิเคราะห์ประวัติการรัน Test (Test History Log) ด้านล่างนี้ และจำแนก Test Case แต่ละตัวออกเป็น 3 ประเภท:

1. STABLE: ผ่านตลอด ไม่มีปัญหา
2. FLAKY: ผ่านบ้างตกบ้าง มักเกิดจากสภาพแวดล้อม (Network, Database, Timeout) โดยให้วิเคราะห์จาก Error Message
3. DEFECT_HOTSPOT: ตกซ้ำๆ ด้วยสาเหตุเดิม หรือเป็นจุดที่โค้ดมีแนวโน้มจะพังถาวร (Bug ของจริง)

ข้อมูลประวัติการรัน Test (JSON):
${JSON.stringify(historyData, null, 2)}

ข้อกำหนดผลลัพธ์ (ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่น):
{
  "analysis_summary": "สรุปภาพรวมสั้นๆ ว่าระบบมีความเสถียรแค่ไหน",
  "stable_tests": ["test_id"],
  "flaky_tests": [
    { "test_id": "...", "suspected_cause": "อธิบายว่าทำไมถึงคิดว่าเป็น Flaky และน่าจะเกิดจากอะไร" }
  ],
  "defect_hotspots": [
    { "test_id": "...", "error_pattern": "รูปแบบ Error ที่พบ", "urgency": "High | Medium | Low" }
  ]
}`;

    try {
        console.log("   [AI Engine] กำลังส่ง Log ให้ Gemini วิเคราะห์หาความผิดปกติ...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2, // ใช้ค่าต่ำเพื่อให้การวิเคราะห์มีความแม่นยำเชิงตรรกะ
            }
        });

        return response.text;
    } catch (error) {
        console.error("   [API Error] ไม่สามารถเชื่อมต่อ AI ได้:", error.message);
        throw error;
    }
}

async function runAIDefectDetection() {
    console.log("===  [START] Step 3: AI Defect Detection Engine ===\n");

    const historyPath = path.join(__dirname, 'test_history_log.json');
    if (!fs.existsSync(historyPath)) {
        console.error(" ไม่พบไฟล์ประวัติการทดสอบ test_history_log.json");
        return;
    }

    const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    console.log(`1. โหลดข้อมูลประวัติการรันทั้งหมด: ${historyData.length} รอบ`);

    try {
        // โยนข้อมูลให้ AI จัดการ
        const aiAnalysisResult = await analyzeLogsWithAI(historyData);
        
        console.log("2. AI วิเคราะห์เสร็จสิ้น กำลังจัดเตรียมรายงาน...\n");
        const parsedReport = JSON.parse(aiAnalysisResult);

        // แสดงผลลัพธ์ที่ AI วิเคราะห์ได้
        console.log(" รายงานการวิเคราะห์จาก AI:");
        console.log("--------------------------------------------------");
        console.log(` สรุปภาพรวม: ${parsedReport.analysis_summary}\n`);

        console.log(" หมวด STABLE (เสถียร):", parsedReport.stable_tests.join(", ") || "ไม่มี");
        
        console.log("\n หมวด FLAKY (เทสผีหลอก/ไม่เสถียร):");
        parsedReport.flaky_tests.forEach(t => {
            console.log(`   - [${t.test_id}] สงสัยว่าเกิดจาก: ${t.suspected_cause}`);
        });

        console.log("\n หมวด DEFECT HOTSPOTS (พบบั๊กถาวร):");
        parsedReport.defect_hotspots.forEach(t => {
            console.log(`   - [${t.test_id}] ความเร่งด่วน: ${t.urgency}`);
            console.log(`     รูปแบบ Error: ${t.error_pattern}`);
        });

        // บันทึกผลลัพธ์
        const reportPath = path.join(__dirname, 'ai_defect_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(parsedReport, null, 2), 'utf8');
        
        console.log("\n==================================================");
        console.log(` บันทึกรายงานเชิงลึกจาก AI ลงไฟล์: ai_defect_report.json`);
        console.log("===  [END] Step 3 Pipeline Completed ===");

    } catch (err) {
         console.error("[ข้อผิดพลาด]:", err.message);
    }
}

runAIDefectDetection();

// const fs = require('fs');
// const path = require('path');

// function runDefectDection(){
//     console.log("===  START Defect Detection Engine === \n");
//     const historyPath = path.join(__dirname, 'test_history_log.json');

//     if(!fs.existsSync(historyPath)){
//         console.error("ไม่พบไฟล์ test_history_log.json ");

//         return;
//     }
//     const historyData = JSON.parse(fs.readFileSync(historyPath , 'utf-8'));
//     const totalRuns = historyData.length;

//     console.log(`INFO  วิเคาะห์จากประวัติการรันทั้งหมด : ${totalRuns} รอบ \n`);

//     const testStats  = {}

//     // รวบรวม raw data
//     historyData.foreach(build => {
//         build.results.foreach(tc => {
//             if(!tesStats[tc.test_id]){
//                 testStats[tc.test_id] = {passed: 0 , failed: 0 , error_messages: new Set()};

//             }
//             if(tc.status === 'PASSED'){
//                 testStats[tc.test_id].passed++;
//             }
//             else{
//                 testStats[tc.test_id].failed++;
//                 testStats[tc.test_id].error_messages.add(tc.error_messages)
//             }
//         })
//     })

//     //  หา flaky and defect 
//     const analysisReport = {
//         stable_tests: [],
//         flaky_tests: [],
//         defect_hotspots: []
//     };

//     console.log("Classification Results")
//     console.log("--------------------------------------------------");

//     for(const [test_id , stats] of Object.entries(testStats)){
//         const failureRate = (stats.failed / totalRuns) * 100 ; 
//         if (failureRate == 0){
//             analysisReport.stable_tests.push(test_id);
//             console.log(`STABLE  ${test_id }: Pass 100%`)
//         }
//     } 
// }
