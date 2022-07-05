importClass(android.database.sqlite.SQLiteDatabase);

var questionCommon = require("./questionCommon.js");
FuncConfig = storages.create("data");
var zCount = FuncConfig.get("zCount", 2); //四人赛（争上游答题）轮数
//var customize_flag = Number(FuncConfig.get("cChoose", 2)); //自定义运行标志
var 对抗赛 = FuncConfig.get("对战", false);
var delaytime1 = FuncConfig.get("延时最小值", 520);
var delaytime2 = FuncConfig.get("延时最大值", 620);
delaytime2 = Number(delaytime2);
delaytime1 = Number(delaytime1);

/**
 * @description: 生成从minNum到maxNum的随机数
 * @param: minNum-较小的数
 * @param: maxNum-较大的数
 * @return: null
 */
function randomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1, 10);
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        default:
            return 0;
    }
}
/**
 * @description: 定义延时函数
 * @param: seconds-延迟秒数
 * @return: null
 */
function delay(seconds) {
    sleep(1000 * seconds); //sleep函数参数单位为毫秒所以乘1000
}
/**
 * @description: 争上游答题 20200928增加 四人赛 20210303改名
 * @param: null
 * @return: null
 */

function zsyQuestion() {
    if (!className("RadioButton").exists()) { //如果不在答题界面
        //toastLog("等待加载出主页啊啊啊");
        //while (!id("home_bottom_tab_button_work").exists()); //等待加载出主页
        //id("home_bottom_tab_button_work").findOne().click(); //点击主页正下方的"学习"按钮
        //delay(2);
        toastLog("我的？！");
        text("我的").click();
        while (!text("我要答题").exists());
        if (!textContains("我要答题").exists()) {
            delay(1);
            click("我要答题");
        } else {
            (!text("我要答题").exists());
            delay(1);
            text("我要答题").findOne().parent().click();
        }
        while (!text("答题练习").exists()); //可用词：排行榜 答题竞赛
        delay(1);
        className("android.view.View").text("答题练习").findOne().parent().child(8).click();
        console.log("开始四人赛")
        while (!text("开始比赛").exists());
        if (className("android.view.View").text("开始比赛").exists()) {
            className("android.view.View").text("开始比赛").findOne().click();
        }
    }
    toastLog("等待开始");
    while (!text("开始").exists());
    let zNum = 0; //轮数
    let zCount = 2;
    while (true) {
        if (className("android.widget.Button").exists()) {
            className("android.widget.Button").text("知道了").findOne().click();
            console.log("今日已完成30次对战，请明日再来");
            while (!id("home_bottom_tab_button_work").exists()) {
                back();
                sleep(1000);
                continue;
            }
            break;
        }
        log("competition的if前");
        if (!text("继续挑战").exists()) { //20201225答题界面变化 距离答题结束 删除
            questionCommon.zsyQuestionLoop();
        }
        if (className("android.view.View").text("继续挑战").exists() || textContains("继续挑战").exists()) //遇到继续挑战，则本局结束
        {
            console.info("四人赛本局结束!");
            zNum++;
            if (zNum >= zCount) {
                //console.log("四人赛结束，双人对战开始！");
                //回退4次返回主页 
                back();
                delay(1);
                back();
                delay(1);
                back();
                delay(1);
                back();
                break;
            } else {
                console.warn("第" + (zNum + 1) + "轮开始...")
                delay(2); //等待2秒开始下一轮
                back();
                delay(1);
                back();
                while (!text("答题练习").exists()); //排行榜 答题竞赛
                delay(1);
                className("android.view.View").text("答题练习").findOne().parent().child(8).click();
                console.log("开始四人赛")
                delay(2);
                if (className("android.view.View").text("开始比赛").exists()) {
                    className("android.view.View").text("开始比赛").findOne().click();
                }
                delay(3);
                if (className("android.widget.Button").exists()) {
                    className("android.widget.Button").text("知道了").findOne().click();
                    console.log("今日已完成30次对战，请明日再来");
                    back();
                    delay(1);
                    back();
                    delay(1);
                    back();
                    delay(1);
                    back();
                    delay(1);
                    if (id("my_display_name").exists()) { //我的主页，再退一步回主页
                        back();
                        delay(1);
                    } //单纯back有概率退出但又有可能只退到我的页面 故加判断
                    return;
                }
                delay(3);
            }
        }
    }
}


/**
 * @description: 双人对战答题 20200928增加
 * @param: null
 * @return: null
 */
function SRQuestion() {
    while (!id("comm_head_xuexi_mine").exists());
    id("comm_head_xuexi_mine").click();
    while (!text("我要答题").exists());
    if (!textContains("我要答题").exists()) {
        delay(1);
        click("我要答题");
    } else {
        (!text("我要答题").exists());
        delay(1);
        text("我要答题").findOne().parent().click();
    }

    while (!text("每日答题").exists());
    let myImage = className("android.view.View").text("每日答题").findOne();
    myImage = myImage.parent().parent().child(9);
    myImage.click();
    sleep(1000);
    if (text("网络较差").exists()) {
        toastLog("网络较差！下次再战！");
        return;
    }
    className("android.view.View").text("").findOne().click();
    console.verbose("开始双人对战");
    while (!text("开始").exists());
    let zNum = 1; //轮数
    while (true) {
        sleep(2000);
        if (textContains("知道了").exists()) { //今日次数已超过
            className("android.widget.Button").text("知道了").findOne().click();
            console.log("今日已完成30次对战，请明日再来");
            while (!id("home_bottom_tab_button_work").exists()) {
                back();
                sleep(1000);
                continue;
            }
            break;
        }
        if ( /*textContains("距离答题结束").exists() &&*/ !text("继续挑战").exists()) { //20201225界面变化 距离答题结束 删除
            questionCommon.zsyQuestionLoop();
        }
        if (className("android.view.View").text("继续挑战").exists() || textContains("继续挑战").exists()) //遇到继续挑战，则本局结束
        {
            console.info("双人对战本局结束!");
            zNum++;
            if (zNum >= zCount) {
                console.log("双人对战结束！返回主页！");
                //回退4次返回主页 
                back();
                delay(1);
                back();
                delay(1);
                if (text("退出").exists()) {
                    className("android.widget.Button").text("退出").findOne().click();
                    delay(1);
                }
                back();
                delay(1);
                back();
                delay(1);
                if (id("my_display_name").exists()) { //我的主页，再退一步回主页
                    back();
                    delay(1);
                } //单纯back有概率退出但又有可能只退到我的页面 故加判断
                break;
            } else {
                console.log("即将开始下一轮...")
                back();
                delay(1);
                back();
                delay(1);
                if (textContains("退出").exists()) {
                    className("android.widget.Button").text("退出").findOne().click();
                    delay(1);
                }
                while (!text("答题练习").exists()); //排行榜 答题竞赛
                delay(1);
                className("android.view.View").text("答题练习").findOne().parent().child(9).click();
                console.log("开始双人对战");
                delay(2);
                if (className("android.view.View").text("邀请对手").exists()) {
                    className("android.view.View").text("邀请对手").findOne().parent().child(0).click();
                } //原为随机邀请对手
                if (className("android.view.View").text("随机匹配").exists()) {
                    className("android.view.View").text("随机匹配").findOne().parent().child(0).click();
                } //20200125修改为邀请好友&随机匹配
                delay(1);
                if (className("android.view.View").text("开始对战").exists()) {
                    className("android.view.View").text("开始对战").findOne().click();
                }
                delay(3);
                if (className("android.widget.Button").exists()) {
                    console.log("今日已完成30次对战，请明日再来");
                    back();
                    delay(1);
                    back();
                    delay(1);
                    back();
                    delay(1);
                    if (id("my_display_name").exists()) { //我的主页，再退一步回主页
                        back();
                        delay(1);
                    } //单纯back有概率退出但又有可能只退到我的页面 故加判断
                    return;
                }
                delay(3);
            }
            console.warn("第" + zNum.toString() + "轮开始...")
        }
    }
}
/*************************************************争上游、双人对战旧版部分 对战速度快，容易卡*************************************************/
/**
 * @description: 双人对战
 * @param: null
 * @return: null
 */

function doubleBattle() {
    while (!id("comm_head_xuexi_mine").exists());
    id("comm_head_xuexi_mine").click();
    while (!text("我要答题").exists());
    if (!textContains("我要答题").exists()) {
        delay(1);
        click("我要答题");
    } else {
        (!text("我要答题").exists());
        delay(1);
        text("我要答题").findOne().parent().click();
    }

    while (!text("每日答题").exists());
    var myImage = className("android.view.View").text("每日答题").findOne();
    myImage = myImage.parent().parent().child(9);
    myImage.click();
    sleep(1000);
    if (text("网络较差").exists()) {
        toastLog("网络较差！下次再战！");
        return;
    }
    className("android.view.View").text("").findOne().click();
    console.verbose("开始双人对战");
    sleep(3000);
    if (className("android.widget.Button").exists()) {
        click("知道了");
        console.log("今日已完成30次对战，请明日再来");
        while (!id("home_bottom_tab_button_work").exists()) {
            back();
            sleep(1000);
            continue;
        }
        return;
    }
    let conNum = 0; //连续答对的次数
    let lNum = 1; //轮数
    rightCount = 0; //答对题数
    while (!text("开始").exists());
    while (rightCount < 5) {
        try {
            if (questionCommon.competitionLoop(conNum)) { //如果点击正确答案，正确点击数加1
                rightCount++;
            }
        } catch (error) {

        }
        sleep(200);
        if (text("100").depth(24).exists() || textContains("继续挑战").exists() || textContains("开始比赛").exists()) {
            toastLog("有人100了，本轮结束。");
            break;
        }
        //if (rightCount == 5){break;}
        conNum++;

    }
    console.verbose("双人对战结束");
    sleep(5000);
    back();
    sleep(1000);
    back();
    text("退出").click();
    while (!desc("工作").exists() || !id("home_bottom_tab_button_work").exists() || !text("我的").exists()) {
        //console.log("正在等待加载出主页");
        back();
        sleep(1000);
    }
}

/**
 * @description: 争上游答题
 * @param: null
 * @return: null
 */
function competition() {
    while (!id("comm_head_xuexi_mine").exists());
    id("comm_head_xuexi_mine").click();
    while (!text("我要答题").exists());
    if (!textContains("我要答题").exists()) {
        delay(1);
        click("我要答题");
    } else {
        (!text("我要答题").exists());
        delay(1);
        text("我要答题").findOne().parent().click();
    }

    while (!text("每日答题").exists());
    sleep(1000);
    let myImage = className("android.view.View").text("每日答题").findOne();
    myImage = myImage.parent().parent().child(8);
    myImage.click();
    if (text("网络较差").exists()) {
        toastLog("网络较差！下次再战！");
        return;
    }
    console.verbose("开始四人赛");
    sleep(1000);
    let conNum = 0; //连续答对的次数
    let lNum = 2; //轮数
    for (i = 0; i < lNum; i++) {
        while (!text("开始比赛").exists());
        text("开始比赛").click();
        console.verbose("第" + (i + 1) + "轮开始");
        conNum = 0; //连续答对的次数
        rightCount = 0; //答对题数
        sleep(3000);
        if (className("android.widget.Button").exists()) {
            className("android.widget.Button").text("知道了").findOne().click();
            console.log("今日已完成30次对战，请明日再来");
            return;
        }
        while (!text("开始").exists());
        while (rightCount < 5) {
            if (!confirm) {
                console.verbose("正在查找题库......");
                break;
            }
            try {
                var isRight = false;
                // isRight = questionCommon.competitionLoop(conNum);
                if (questionCommon.competitionLoop(conNum)) { //如果点击正确答案，正确点击数加1
                    rightCount++;
                }
            } catch (e) {
                //console.error("错误捕获:"+e);
                break;
            }
            if (text("100").depth(24).exists() || textContains("继续挑战").exists() || textContains("开始比赛").exists()) {
                toastLog("有人100了，本轮结束。");
                break;
            }
            //if (rightCount == 5) {break;}
            conNum++;
        }
        console.verbose("5秒后开始下一轮...");
        sleep(7000);
        if ((lNum - i) > 1) {
            //while (!text("继续挑战").exists());
            text("继续挑战").click();
        }
        sleep(1000);
    }
    // console.log("争上游答题结束");
    console.verbose("四人赛结束,准备开始双人对战......");
    sleep(3000);
    //回退4次返回主页 
    back();
    delay(1);
    back();
    delay(1);
    back();
    delay(1);
    back();
    delay(1);
    if (id("my_display_name").exists()) { //我的主页，再退一步回主页
        back();
        delay(1);
    } //单纯back有概率退出但又有可能只退到我的页面 故加判断
}


/**********************四人赛和双人对战综合答题************************* */

/**
 * @description: 争上游答题
 * @param: null
 * @return: null
 */
function compe(lNum) {
    let conNum = 0; //连续答对的次数
    // let lNum = 10; //轮数
    if (text("网络较差").exists()) {
        toastLog("网络较差！下次再战！");
        return;
    }
    for (i = 0; i < lNum; i++) {
        if (lNum > 1) {
            console.warn("第" + (i + 1) + "轮争上游答题");
            text("开始比赛").click();
            sleep(3000);
            while (!text("开始").exists());
        } else if (text("开始比赛").exists()) {
            console.verbose("开始争上游答题");
            text("开始比赛").click();
            while (!text("开始").exists());
        } else if (className("android.view.View").text("").exists()) {
            console.verbose("开始双人对战");
            className("android.view.View").text("").findOne().click();
            while (!text("开始").exists());
            // text("").click();
            // while (text("邀请对手").exists());
            // text("开始对战").click();
        }
        //sleep(4000);
        conNum = 0; //连续答对的次数
        rightCount = 0; //答对题数
        /* if (!className("android.view.View").depth(29).exists()) {
            while (!text("开始").exists()); 
        } */
        // while(!className("RadioButton").exists());
        while (rightCount < 5) {
            // sleep(1000)
            // while (!className("ListView").exists());
            /*if (!className("RadioButton").exists()) {
                console.error("没有找到题目！请检查是否进入答题界面！");
                console.log("停止");
                break;
            }*/
            try {
                // var isRight = false;
                // isRight = questionCommon.competitionLoop(conNum);
                if (questionCommon.competitionLoop(conNum)) {
                    rightCount++;
                }
            } catch (error) {
                // console.error(error);
            }

            // console.error("正确题数：" + rightCount)
            if (text("100").depth(24).exists() || text("继续挑战").exists()) {
                toastLog("有人100了");
                break;
            }
            if (rightCount == 5) {
                break;
            }
            conNum++;

        }
        sleep(5000);
        if ((lNum - i) > 1) {
            text("继续挑战").click();
            sleep(1000);
        }
    }
    let listPepole = className("android.widget.Image").depth(29).find();
    if (listPepole.length > 2) {
        console.verbose("答题结束");
        for (i = 0; i < 2; i++) {
            sleep(1000);
            back();
        }
    } else {
        console.verbose("对战结束");
        sleep(5000);
        back();
        sleep(1000);
        back();
        text("退出").click();
    }
}

function main() {
    //请求截图
    if (!requestScreenCapture()) {
        toast("请求截图失败");
        exit();
    }

    console.setPosition(0, device.height * 0.45); //部分华为手机console有bug请注释本行
    //console.error("如果不在答题界面，请先选择四人赛或者双人对战。");
    console.show();
    if (!className("RadioButton").exists()) { //如果不在答题界面
        //console.error("没有进入答题界面！系统即将自动进入对战答题界面。");
        while (!id("home_bottom_tab_button_work").exists()) {
            back();
            sleep(1000);
            continue;
        } //适合内部返回主页，不适合已清理强国后台情况下初始拉起强国app
        if (customize_flag == 1) {
            zsyQuestion();
            SRQuestion();
        } else {
            zsyQuestion();
            doubleBattle();
        }
    }
    allCount = 0;
}

function zsy() {
    //请求截图
    if (!requestScreenCapture()) {
        toast("请求截图失败");
        exit();
    }

    console.setPosition(0, device.height * 0.45); //部分华为手机console有bug请注释本行
    //console.error("如果不在答题界面，请先选择四人赛或者双人对战。");
    console.show();
    console.hide();
    toastLog("为防止OCR错误，悬浮窗已关闭！");
    //if (!className("RadioButton").exists()) { //如果不在答题界面
    //    //console.error("没有进入答题界面！系统即将自动进入对战答题界面。");
    //    while (!id("home_bottom_tab_button_work").exists()) {
    //        back();
    //        sleep(1000);
    //        continue;
    //    } //适合内部返回主页，不适合已清理强国后台情况下初始拉起强国app
    zsyQuestion();
    
    toastLog("模型已销毁");
    easyedge.destroy();
    //}
    allCount = 0;
}

function SR() {
    //请求截图
    if (!requestScreenCapture()) {
        toast("请求截图失败");
        exit();
    }

    console.setPosition(0, device.height * 0.45); //部分华为手机console有bug请注释本行
    //console.error("如果不在答题界面，请先选择四人赛或者双人对战。");
    console.show();
    if (!className("RadioButton").exists()) { //如果不在答题界面
        //console.error("没有进入答题界面！系统即将自动进入对战答题界面。");
        while (!id("home_bottom_tab_button_work").exists()) {
            back();
            sleep(1000);
            continue;
        } //适合内部返回主页，不适合已清理强国后台情况下初始拉起强国app
        //if (customize_flag == 1) {
        //    toastLog("注意双人还没有使用OCR答题！");
        toast("双人答题还处于测试阶段！")
            SRQuestion();
            
    toastLog("模型已销毁");
    easyedge.destroy();
        //} else {
        //    toastLog("注意双人还没有使用OCR答题！");
        //    doubleBattle();
        //}
    }
    allCount = 0;
}

exports.main = main;
exports.zsy = zsy;
exports.SR = SR;