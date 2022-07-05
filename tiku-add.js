importClass(android.database.sqlite.SQLiteDatabase);

var func = require("./func.js");

//开启截屏功能
if (!requestScreenCapture()) { 
    console.log("请求截图失败"); 
    exit(); 
} 
//toastLog(" 请在无障碍中选择本 APP");
auto.waitFor();
var FuncConfig = storages.create("data"); 
let window = floaty.window(
    <vertical>
        <button id="Bmin" text="最小化" w="90" h="35" bg="#77ffffff"  textColor="blue" textSize="10sp" />
        <button id="move" text=" 移动 " w="90" h="35" bg="#77ffffff"  textColor="blue" textSize="10sp" />
        <button id="dtiku" text=" 每日答题刷题库 " w="90" h="35" bg="#77ffffff"  textColor="blue" textSize="10sp" />
       <button id="ctiku" text=" 挑战答题刷题库 " w="90" h="35" bg="#77ffffff"  textColor="blue" textSize="10sp" /> 
       <button id="ttiku" text="  挑战答题通关 " w="90" h="35" bg="#77ffffff"  textColor="blue" textSize="10sp" />
       <button id="dztiku" text=" 四人赛刷题库 " w="90" h="35" bg="#77ffffff"  textColor="blue" textSize="10sp" />
       <button id="stop" text=" 停止 " w="90" h="35" bg="#77ffffff"  textColor="blue" textSize="10sp" />
        <button id="exit" text=" 关闭浮窗 " w="90" h="35" bg="#77ffffff"  textColor="blue" textSize="10sp" />
        <text textSize="9sp" textColor="#DA70D6" gravity="center" textStyle="bold" text="永久免费正版更新" />
        <text textSize="9sp" textColor="#DA70D6" gravity="center" textStyle="bold" text="支持正版安全稳定" />
        <text textSize="9sp" textColor="#DA70D6" gravity="center" textStyle="bold" text="勿信破解勿信付费" />
    </vertical>
);

//布局完成以后, 获取悬浮窗宽高
ui.run(function() {
    windowWidth = window.getWidth();
    windowHeight = window.getHeight();
}, 1000);

let deviceWidth = device.width;
let deviceHeight = device.height;
window.setPosition(0, 0);
//window.setPosition(deviceWidth - windowWidth, deviceHeight - windowHeight);
setInterval(() => {}, 1000);
let wx, wy, downTime, windowX, windowY;
// 这个函数是对应悬浮窗的移动
window.move.setOnTouchListener(function(view, event) {
    switch (event.getAction()) {
        case event.ACTION_DOWN:
            wx = event.getRawX();
            wy = event.getRawY();
            windowX = window.getX();
            windowY = window.getY();
            downTime = new Date().getTime();
            return true;
        case event.ACTION_MOVE:
            // 如果按下的时间超过 xx 秒判断为长按，调整悬浮窗位置
            if (new Date().getTime() - downTime > 300) {
                window.setPosition(windowX + (event.getRawX() - wx), windowY + (event.getRawY() - wy));
            }
            return true;
        case event.ACTION_UP:
            // 手指弹起时如果偏移很小则判断为点击
            if (Math.abs(event.getRawY() - wy) < 30 && Math.abs(event.getRawX() - wx) < 30) {
                toastLog(" 长按调整位置 ")
            }
            return true;
    }
    return true;
});
//悬浮窗最小化
function 最小化() {
    window.Bmin.setText("≡≡");
    window.setSize(windowWidth, 150);
    window.setPosition(0,0);
}

function 最大化() {
    //console.show();
    window.Bmin.setText("最小化");
    window.setSize(windowWidth, windowHeight);
    window.setPosition(0, 0);

}
window.Bmin.click(() => {
    if (window.Bmin.text() == "最小化") {
        最小化();
    } else {
        最大化();
    }
});
var chide = FuncConfig.get("隐藏", false);
if (chide) { //界面隐藏
    console.hide();
}else{
    console.setPosition(0, device.height * 0.45); //部分华为手机console有bug请注释本行
    console.show(); //部分华为手机console有bug请注释本行
}
func.start_app();
console.log("已经回到主页，准备刷题库吧！");
//启用按键监听，按下音量下键脚本结束
threads.start(function() { //在子进程中运行监听事件
    events.observeKey();
    events.on("key", function(code, event) {
        var keyCodeStr = event.keyCodeToString(code);
        if (keyCodeStr == "KEYCODE_VOLUME_DOWN") {
            console.hide();
            alert("程序已结束。");
            exit();
        }
    });
});
// 这个函数是对应悬浮窗的退出
window.exit.click(() => {
    toastLog(" 退出！");
    threads.shutDownAll();
    console.hide();
    exit();
});


let th = null;
//每日答题刷题库
window.dtiku.click(() => {
    最小化();
    if (th == null) {
        th = threads.start(function () {
            toastLog(" 开启线程");
            d_main();
        });
    } else {
        if (th.isAlive()) {
            toastLog(" 脚本在运行\n正版免费正版更新勿信付费勿信破解");
        } else {
            th = threads.start(function () {
                d_main();
            });
        }
    }
});

//挑战答题刷题库
window.ctiku.click(() => {
    最小化();
    if (th == null) {
        th = threads.start(function () {
            toastLog(" 开启线程");
            c_main();
        });
    } else {
        if (th.isAlive()) {
            toastLog(" 脚本在运行\n正版免费正版更新勿信付费勿信破解");
        } else {
            th = threads.start(function () {
                c_main();
            });
        }
    }
}); 
//四人双人答题刷题库
window.dztiku.click(() => {
    toastLog("目前暂不支持四人赛刷题库！");
});


//停止
window.stop.click(() => {
    if (th == null) {
        toastLog(" 没有进行中的脚本 ");
    } else {
        if (th.isAlive()) {
            threads.shutDownAll();
            toastLog(" 停止！");
        } else {
            toastLog(" 没有进行中的脚本 ");
        }
    }
});




var questionCommon = require("./questionCommon.js");

var lCount = Number(FuncConfig.get("挑战答题轮数",500));
var qCount = Number(FuncConfig.get("挑战答题次数",500));
/**
 * @description: 挑战答题
 * @param: null
 * @return: null
 */
function challengeQuestion(lNum) {
    let conNum = 0;//连续答对的次数
    // let lNum = 0;//轮数
    while (true) {
        // sleep(1000)
        if (!className("RadioButton").exists()) {
            console.error("没有找到题目！请检查是否进入答题界面！");
            console.log("停止");
            break;
        }
        // while(!className("ListView").exists());
        questionCommon.challengeQuestionLoop(conNum, qCount);
        sleep(questionCommon.randomNum(2, 5) * 1000);
        // sleep(4000);
        if (text("v5IOXn6lQWYTJeqX2eHuNcrPesmSud2JdogYyGnRNxujMT8RS7y43zxY4coWepspQkvw" +
            "RDTJtCTsZ5JW+8sGvTRDzFnDeO+BcOEpP0Rte6f+HwcGxeN2dglWfgH8P0C7HkCMJOAAAAAElFTkSuQmCC").exists()) //遇到❌号，则答错了,不再通过结束本局字样判断
        {
            if (conNum >= qCount) {
                lNum++;
                if (lNum >= lCount) {
                    console.verbose("挑战答题结束！");
                } else {
                    console.verbose("等5秒开始下一轮...");
                }
                back();
                sleep(1000);
                back();
                break;
            } else {
                console.error("出现错误，等5秒重新开始...");
                sleep(3000); //等待5秒才能开始下一轮
                back();
                //desc("结束本局").click();//有可能找不到结束本局字样所在页面控件，所以直接返回到上一层
                sleep(2000);
                text("再来一局").click();
                sleep(4000);
                conNum = 0;
            }
        }
        else//答对了
        {
            conNum++;
        }
    }
}

function c_main() {
    //console.setPosition(0, device.height * 0.5); //部分华为手机console有bug请注释本行
    console.show();
    if (!className("RadioButton").exists()) { //如果不在答题界面
        console.error("没有进入答题界面！系统即将自动进入挑战答题界面。");
        while (!id("home_bottom_tab_button_work").exists()) {
            back();
            sleep(1000);
            continue;
        } //适合内部返回主页，不适合已清理强国后台情况下初始拉起强国app
        while (!id("comm_head_xuexi_mine").exists());
        id("comm_head_xuexi_mine").click();
        //while (!textContains("我的").exists());
        //text("我的").click();
        while (!textContains("我要答题").exists());
        sleep(1000);
        click("我要答题");
        while (!text("每日答题").exists());
        sleep(1000);
        let myImage = className("android.view.View").text("每日答题").findOne();
        // console.log(myImage.parent().parent().childCount());
        myImage = myImage.parent().parent().child(10);
        myImage.click();
        //if (text("每日答题").exists()) {
        for (i = 0; i < lCount; i++) {
            let myImage = className("android.view.View").text("每日答题").findOne();
            // console.log(myImage.parent().parent().childCount());
            myImage = myImage.parent().parent().child(10);
            myImage.click();
            console.warn("第" + (i + 1) + "轮挑战答题");
            sleep(6000);
            challengeQuestion(i);
        }
    } else {
        console.verbose("开始挑战答题");
        sleep(1000);
        challengeQuestion(1);
    }
    // answerWrong();
    //console.hide()
}




var dCount=Number(FuncConfig.get("每日答题轮数",20));
/**
 * @description: 每日答题
 * @param: null
 * @return: null
 */
function dailyQuestion() {
    let dlNum = 0;//每日答题轮数
    while (true) {
        sleep(questionCommon.randomNum(1, 4) * 1000);
        while(!(textStartsWith("填空题").exists() || textStartsWith("多选题").exists() || textStartsWith("单选题").exists()));
        if (!(textStartsWith("填空题").exists() || textStartsWith("多选题").exists() || textStartsWith("单选题").exists())) {
            console.error("没有找到题目！请检查是否进入答题界面！");
            console.log("停止");
            break;
        }
        questionCommon.dailyQuestionLoop();
        while ((!(textStartsWith("+").exists())) && (dlNum > dCount)){
            if (id("message").exists()) {
                id("button1").findOne().click();
            }
        }
            if (text("再来一组").exists()) {
            sleep(2000);
            dlNum++;
            if (dCount>dlNum) {
                text("再来一组").click();
                console.warn("第" + (dlNum + 1).toString() + "轮答题:");
                sleep(1000);
            }
            else {
                console.verbose("每日答题刷题库结束！");
                while(!text("返回").exists());
                text("返回").click(); sleep(2000);
                break;                
            }
        }
    }
    //threads.shutDownAll();
}

function d_main() {
    //console.setPosition(0, device.height * 0.5);
    console.show();
    if (!(textStartsWith("填空题").exists() || textStartsWith("多选题").exists() || textStartsWith("单选题").exists())) { //如果不在答题界面
        console.error("没有进相应的入答题界面！系统即将自动进入每日答题界面进行刷题，如果没有进入，请再执行一次。");
        
        
        while (!id("home_bottom_tab_button_work").exists()) {
            back();
            sleep(1000);
            continue;
        } //适合内部返回主页，不适合已清理强国后台情况下初始拉起强国app
        
        while (!id("comm_head_xuexi_mine").exists());
        id("comm_head_xuexi_mine").click();
        while (!textContains("我要答题").exists());
        sleep(1000);
        click("我要答题");
        while (!text("每日答题").exists());
        sleep(1000);
    //if (text("每日答题").exists()) {
        //for (i = 0 ; i < dCount ; i++) {
            //console.warn("第" + (i + 1) + "轮每日答题");
            text("每日答题").click();
            sleep(1000);
            dailyQuestion();
        //}
    } else {
        console.verbose("开始每日答题");
        sleep(1000);
        dailyQuestion();
    }
        //console.hide();
}
// 双填空需要两个空字数相等
// 双填空测试四月第二周（正常）
// 复杂填空民法典专项一（已支持）
// main() // 调试完记得注释掉