const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// โหลดตัวแปรจากไฟล์ .env
require('dotenv').config();

// ใส่ API Key ของคุณที่นี่ (ใน Production ควรดึงจาก process.env)
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

async function callAIEngine(sourceCode) {
    const prompt = `คุณคือ Senior QA Automation Engineer ผู้เชี่ยวชาญด้าน White-box Testing
หน้าที่ของคุณคือวิเคราะห์ซอร์สโค้ดต่อไปนี้และสร้างแผนทดสอบอย่างละเอียด

ซอร์สโค้ดที่ต้องวิเคราะห์:
${sourceCode}

ข้อกำหนดผลลัพธ์:
คุณต้องตอบกลับเป็น Array ของ JSON Object เท่านั้น โดยมีโครงสร้างดังนี้:
[
  {
    "test_id": "string (เช่น TC_001)",
    "scenario": "string (คำอธิบายภาษาไทย)",
    "test_type": "Positive | Negative | Edge_Case",
    "inputs": { "price": number, "discountCode": "string หรือ ค่าว่าง" },
    "expected": { "isError": boolean, "outputValue": "number หรือ ข้อความ Error" }
  }
]
ห้ามมีคำอธิบายอื่นใดนอกจาก JSON`;

    try {
        console.log("   [API] กำลังส่ง Request ไปที่ Gemini API...");
        // เราใช้โมเดล gemini-2.5-flash เพราะรวดเร็วและเหมาะกับงานแบบนี้
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // บังคับให้ AI ตอบเป็น JSON เสมอ
                responseMimeType: "application/json",
                // ปรับ Temperature ให้ต่ำๆ เพื่อให้ผลลัพธ์นิ่งและเป็นเหตุเป็นผล
                temperature: 0.1, 
            }
        });

        // ดึงข้อความ JSON ที่ AI ตอบกลับมา
        return response.text;
    } catch (error) {
        console.error("   [API Error] ไม่สามารถเชื่อมต่อ AI ได้:", error.message);
        throw error;
    }
}

async function runPipeline() {
    try {
        console.log("=== [START] Step 1: Test Plan Generation (REAL AI MODE) ===");
        
        const targetPath = path.join(__dirname, 'checkout.js');
        console.log(`1. กำลังอ่านไฟล์เป้าหมาย: ${targetPath}`);
        const sourceCode = fs.readFileSync(targetPath, 'utf-8');

        console.log("2. กำลังส่ง source code ให้ AI (Gemini) เพื่อวิเคราะห์...");
        // คราวนี้เรียก AI จริงๆ แล้ว!
        const rawJsonResponse = await callAIEngine(sourceCode);

        console.log("3. ได้รับผลลัพธ์จาก AI กำลังตรวจสอบโครงสร้าง JSON...");
        const parsedJson = JSON.parse(rawJsonResponse);

        const outputPath = path.join(__dirname, 'test_cases.json');
        fs.writeFileSync(outputPath, JSON.stringify(parsedJson, null, 2), 'utf-8');

        console.log(`\n[สำเร็จ] สมองกล AI ได้สร้างแผนการทดสอบจำนวน ${parsedJson.length} เคส เรียบร้อยแล้ว!`);
        console.log(`ผลลัพธ์ถูกบันทึกไว้ที่: ${outputPath}`);
        console.log("=== [END] Step 1 Pipeline Completed ===");

    } catch (err) {
        console.error("[ข้อผิดพลาดในระบบ Pipeline]:", err.message);
    }
}

runPipeline();

// // ค่าข้อมูลจะเป็น simulated ไปก่อนเพื่อให้เห็นภาพของข้อมูล

// const fs = require('fs');
// const path = require('path');
// const { GoogleGenAI } = require('@google/genai');

// // หมายเหตุ: สาหรับโค้ดตัวอย่างนี้เราจาลองฟังก์ชันเรียกไปยัง AI API Gateway
// // ในระบบจริงสามารถใช้แพ็กเกจ @google/genai หรือ axios เพื่อดึงข้อมูลได้ตามต้องการ
// async function callAIEngine(sourceCode){
//     const systemPrompt =  ` คุณคือ senior QA Automation Engineer ผู้เชี่ยวชาญด้าน White-box Testing หน้าที่ของคุณคือวิเคาะห์ 
//     source code ต่อไปนี้เเละสร้างเเผนทดสอบอย่างละเอียดในรูปเเบบ JSON อย่างเคร่งครัดตามสเปก 
//     source code ที่ต้องวิเคาะห์: 
//     ${sourceCode}
    
//     ข้อกำหนดผลลัพธ์ JSON Schema: 
//     [
//         {
//             "test_id" : "String",
//             "scenario" : "String (Thai lang)",
//             "test_type" : "Positive | Negative | Edge_Case",
//             "inputs" : { "price" : "any", "discoutCode" : "any"},
//             "expected" : {"isError" : "boolean", "outputValue": "any"}
//         }
//     ]`;

//     // จำลองการเรียก API (ในระบบจริงเปลี่ยนเป็น fetch หรือ SDK ของผู้ให้บริการ)
//     // นี่คือตัวอย่างผลลัพธ์ที่ AI จะส่งกลับมาหลังจากรันประมวลผลผ่าน JSON Mode
    
//     const simulatedAIResponse = `[
//         {
//             "test_id" : "TC_001",
//             "scenario" : "คำนวณราคาปกติโดยไม่มีส่วนลด",
//             "test_type" : "Positive",
//             "inputs" : { "price" : 100 , "discoutCode" : ""},
//             "expected" : {"isError" : false , "outputValue" : 100}
//         },
//         {
//             "test_id": "TC_002",
//             "scenario": "ใช้โค้ดส่วนลดแบบลดเป็นจำนวนเงินตายตัว WELCOME20",
//             "test_type": "Positive",
//             "inputs": { "price": 100, "discountCode": "WELCOME20" },
//             "expected": { "isError": false, "outputValue": 80 }
//         },
//         {
//             "test_id": "TC_003",
//             "scenario": "ใช้โค้ดส่วนลดแบบคิดเป็นเปอร์เซ็นต์ HALFPRICE",
//             "test_type": "Positive",
//             "inputs": { "price": 200, "discountCode": "HALFPRICE" },
//             "expected": { "isError": false, "outputValue": 100 }
//         },
//         {
//             "test_id": "TC_004",
//             "scenario": "ส่งค่าราคาติดลบเข้าสู ่ระบบเพื ่อเช็ค Validation",
//              "test_type": "Negative",
//             "inputs": { "price": -50, "discountCode": "" },
//             "expected": { "isError": true, "outputValue": "Invalid price: ราคาต้องเป็นตัวเลขและห้ามติดลบ" }
//         },
//         {
//             "test_id": "TC_005",
//             "scenario": "ส่งโค้ดส่วนลดที่ไม่มีในระบบการทางาน",
//             "test_type": "Negative",
//             "inputs": { "price": 100, "discountCode": "INVALID_CODE" },
//             "expected": { "isError": true, "outputValue": "Invalid discount code: โค้ดส่วนลดไม่ถูกต้อง" }
//         },
//         {
//             "test_id": "TC_006",
//             "scenario": "กรณีราคาสินค้าน้อยกว่ามูลค่าส่วนลดรวม (Edge Case)",
//             "test_type": "Edge_Case",
//             "inputs": { "price": 15, "discountCode": "WELCOME20" },
//             "expected": { "isError": false, "outputValue": 0 }
//         }
//     ]`;
//     return simulatedAIResponse;

// }

// async function runPipline(){
//     try{
//         console.log("=== [START] step1 : test plan geneation ===");
//         const targetPath = path.join(__dirname , 'checkout.js');
//         console.log(`1. กำลังอ่านไฟล์เป้าหมาย: ${targetPath}`);
//         const sourceCode = fs.readFileSync(targetPath , 'utf-8');

//         console.log("2. กำลังส่ง source code ให้ ai เพื่อวิเคาะห์เเบบลึกๆ ....");
//         const testPlan = await callAIEngine(sourceCode);

//         console.log("3. กำลังล้างข้อมูลเเละตรวจสอบความถูกต้องของโครงสร้าง JSON....");
//         const parsedJson = JSON.parse(testPlan);

//         const outputPath = path.join(__dirname , 'test_cases.json');
//         fs.writeFileSync(outputPath , JSON.stringify(parsedJson , null ,2), 'utf-8');

//         console.log(`
//         [สาเร็จ] ระบบได้สร้างแผนการทดสอบจานวน ${parsedJson.length} เคส เรียบร้อยแล้ว!`);
//         console.log(`ผลลัพธ์ถูกบันทึกไว้ที่: ${outputPath}`);
//         console.log("=== [END] Step 1 Pipeline Completed ===");

        
//     }catch (err){
//         console.error("[ข้อผิดพลาดในระบบ Pipeline]:", err.message);
//     }
// }

// runPipline();