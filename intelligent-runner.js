const fs = require('fs');
const path = require('path');
const {calculateFinalPrice} = require('./test_plan/checkout.js');

function runIntelligentTests(){
    console.log("===  [START] Step 2: Intelligent Execution Pipeline ===\n");
    // load test cases
    const testCasesPath = path.join(__dirname, 'test_cases.json');
    if (!fs.existsSync(testCasesPath)) {
        console.error(" ไม่พบไฟล์ test_cases.json กรุณาสร้างไฟล์ก่อนรัน");
        return;
    }
    
    const rawData = fs.readFileSync(testCasesPath, 'utf-8');
    const testCases = JSON.parse(rawData);

    console.log(`[INFO] โหลด Test Cases สำเร็จทั้งหมด: ${testCases.length} เคส\n`);
    console.log("--------------------------------------------------");

    let passedCount = 0;
    let failedCount = 0;
    const failedDetails = []; // เก็บรายละเอียดเคสที่พังเพื่อเตรียมส่งไป Step ถัดไป
    
    //  เริ่มวงจรการรันเทส (Execution Loop)
    testCases.forEach((tc) => {
        console.log(` รันเคส: [${tc.test_id}] ${tc.scenario} (Type: ${tc.test_type})`);
        
        let actualOutput;
        let actualIsError = false;

        // บล็อกดักจับการทำงานของฟังก์ชัน
        try{
            // โยน output ไป function เป้าหมาย
            actualOutput = calculateFinalPrice(tc.inputs.price , tc.inputs.discountCode);
        }catch(err){
            // กรณีระบบโยน Error ออกมา (เช่น ค่าติดลบ, โค้ดมั่ว)
            actualIsError = true;
            actualOutput = err.message;
        
        }
        //  ระบบตรวจสอบความถูกต้อง 
        const isErrorMatch = actualIsError === tc.expected.isError;
        const isValueMatch = actualOutput === tc.expected.outputValue;

        if(isErrorMatch && isValueMatch){
            console.log(`PASSED`);
            passedCount++;

        }else{
            console.log(`FAILED`);
            console.log(`     >> คาดหวัง (Expected): isError=${tc.expected.isError}, value="${tc.expected.outputValue}"`);
            console.log(`     >> ได้รับจริง (Actual):  isError=${actualIsError}, value="${actualOutput}"\n`);
            failedCount++;
            
            // เก็บข้อมูลเคสที่ตกไว้ใช้วิเคราะห์ใน Step 4 (Root Cause Analysis)
            failedDetails.push({ test_id: tc.test_id, expected: tc.expected, actual: { isError: actualIsError, value: actualOutput } });
        }
    });
    //  สรุปผลการทดสอบ 
    console.log("==================================================");
    console.log(" สรุปผลการทดสอบ (Test Report)");
    console.log("==================================================");
    console.log(`Total Tests : ${testCases.length}`);
    console.log(` Passed   : ${passedCount}`);
    console.log(` Failed   : ${failedCount}`);
    
    // บันทึก Log กรณีมีเคสที่ไม่ผ่าน เพื่อเป็นข้อมูลตั้งต้นให้ Step 4
    if (failedCount > 0) {
        const errorLogPath = path.join(__dirname, 'error_trace.json');
        fs.writeFileSync(errorLogPath, JSON.stringify(failedDetails, null, 2), 'utf8');
        console.log(`\n[ALERT] ระบบพบเคสที่ไม่ผ่าน! ข้อมูล Error ถูกบันทึกไว้ที่: error_trace.json`);
    } else {
        console.log(`\n[SUCCESS] โค้ดสมบูรณ์แบบ ผ่านทุกเงื่อนไขการทดสอบ! `);
    }
    
    console.log("\n===  [END] Step 2 Pipeline Completed ===");
}

// สั่งรันโปรแกรม
runIntelligentTests();
