"ui";
importClass(com.stardust.autojs.core.accessibility.AccessibilityBridge.WindowFilter);
let bridge = runtime.accessibilityBridge;
let bridgeField = runtime.getClass().getDeclaredField("accessibilityBridge");
let configField = bridgeField.getType().getDeclaredField("mConfig");
configField.setAccessible(true);
configField.set(bridge, configField.getType().newInstance());

bridge.setWindowFilter(new JavaAdapter(AccessibilityBridge$WindowFilter, {
    filter: function(info) {
        return true;
    }
}));

importClass(android.graphics.Paint);
importClass(android.view.View);
//db操作
importClass(android.database.sqlite.SQLiteDatabase);

runtime.loadDex("./libs/YunxiOcr.dex");
if (!files.exists(runtime.files.join(runtime.libraryDir, "libc++_shared.so"))) {
    files.copy("./libs/libc++_shared.so", runtime.files.join(runtime.libraryDir, "libc++_shared.so"));
}
if (!files.exists(runtime.files.join(runtime.libraryDir, "libedge-infer.so"))) {
    files.copy("./libs/libedge-infer.so", runtime.files.join(runtime.libraryDir, "libedge-infer.so"));
}

function detectOcr(path1, path2, path3) {
    var instance = new com.plugin.PaddleOCR.YunxiPlugin(context);
    var isLoad = instance.OnLoad()
    this.init = function(path1, path2, path3) {
        var result = instance.init(4, files.read(path1), files.path(path2), files.path(path3)); //设置模型文件路径
        if (result) {
            return true;
        } else {
            return instance.getLastError(); //如果有错误可以用getLastError获取
        }
    }
    var InitResult = this.init(path1, path2, path3);
    this.Ocr = function(image) {
        if (InitResult) {
            console.time("识别耗时")
            var image = image.getBitmap();
            var end = new Date().getTime();
            var result = instance.ocr(image, 0.9);
            console.timeEnd("识别耗时")
            return result;
        } else {
            return "未初始化"
        }
    }
    this.Destroy = function() {
        instance.destroy();
    }
    events.on('exit', function(t) {
        instance.destroy(); //必须释放,否则下次无法init
    });
}
var OCR = new detectOcr("./tessdata/config.json", "./tessdata/eng.traineddata", "./tessdata/chi_sim.traineddata");

var tikuCommon = require("./tikuCommon.js");
var PrefCheckBox = require('./config.js');
var questionCommon = require("./questionCommon.js");
var competition = require("./competition.js");
var func = require("./func.js");

function getTodayDateString() {
    var date = new Date();
    var y = date.getFullYear();
    var m = date.getMonth();
    var d = date.getDate();
    var s = dateToString(y, m, d); //年，月，日
    return s
}

function dateToString(y, m, d) {
    var year = y.toString();
    if ((m + 1) < 10) {
        var month = "0" + (m + 1).toString();
    } else {
        var month = (m + 1).toString();
    }
    if (d < 10) {
        var day = "0" + d.toString();
    } else {
        var day = d.toString();
    }
    var s = year + "-" + month + "-" + day; //年-月-日
    return s;
}

let deviceWidth = device.width;
let deviceHeight = device.height;
let margin = parseInt(deviceWidth * 0.02);

var storage = storages.create("data");

var flagShut = 0;

var aCount = storage.get("aCount", 12); //文章默认学习篇数
var vCount = storage.get("vCount"); //小视频默认学习个数
var cCount = 2; //收藏+分享+评论次数

var aTime = storage.get("aTime", 30); //每篇文章学习-30秒 30*12≈360秒=6分钟
var vTime = storage.get("vTime"); //每个小视频学习60秒
var rTime = 360; //音视频时长-6分钟

var dyNum = 2; //订阅 2
var commentText = ["支持党，支持国家！", "为实现中华民族伟大复兴而不懈奋斗！", "不忘初心，牢记使命"]; //评论内容，可自行修改，大于5个字便计分
var num = random(0, commentText.length - 1); //随机数    

var aCat = ["推荐", "要闻", "综合"];
var aCatlog = aCat[num]; //文章学习类别，随机取"推荐""要闻"、"新思想"
var aZX = storage.get("aZX"); //文章执行1或2脚本
var date_string = getTodayDateString(); //获取当天日期字符串
var vCat = ["第一频道", "学习视频", "联播频道"];
var vCatlog = vCat[num]; //视频学习类别，随机取 "第一频道"、"学习视频"、"联播频道"
if (num == 0) {
    var s = "央视网";
} else if (num == 1) {
    var s = "央视新闻";
} else {
    var s = "中央广播电视总台";
}

var oU = storage.get('oU', 'http://127.0.0.1:34567');
var tikuCustom = storage.get('tikuCustom', 0);
var tikuPercent = storage.get('tikuPercent', 0.1);
var lCount = storage.get("lCount"); //挑战答题轮数
var qCount = random(5, 7); //挑战答题每轮答题数(5~7随机)
var zCount = storage.get("zCount"); //争上游答题轮数
var zsyzd = 1; //争上游和双人对战是否自动做，1，2 默认自动1
var oldaquestion; //争上游和对战答题循环，定义旧题目对比新题目用20201022
var myScores = {}; //分数
//特殊题，特点：题目一样，答案不同
var ZiXingTi = "选择词语的正确词形。"; //字形题
var DuYinTi = "选择正确的读音。"; //读音题 20201211
var ErShiSiShi = "下列不属于二十四史的是。"; //二十四史
var ZiXingArray = ["选择词语的正确词形。", "选择正确的读音。", "下列不属于二十四史的是。", "下列不属于“十三经”的是。", "下列说法正确的是。", "下列词形正确的是。", "下列读音正确的是。", ];
//特殊题，特点：题目一样，答案不同
var chutiIndexArray = ["（出题：", "（出题单位：", "推荐单位：", "出题：", "来源：《", "（来源：", "来源：", "（推荐：", "推荐："]; //去除题目中尾巴（非题目内容）
var asub = 2;
var customize_flag = false; //自定义运行标志
var zsyNext = parseInt(storage.get("zsyNext"));
var zsyWaitTime = parseInt(storage.get("zsyWaitTime"));
var swipeTimes = parseInt(storage.get("swipeTimes"));
var onlineTiKuUrl1 = storage.get("onlineTiKuUrl1");
var videoChoose = parseInt(storage.get("videoChoose")); //视频选择
var questionAswerLowSpeed = parseInt(storage.get("questionAswerLowSpeed")); // 四人双人赛答题延时下限
var questionAswerHighSpeed = parseInt(storage.get("questionAswerHighSpeed")); // 四人双人赛答题延时上限
var otherQuestionSpeed = parseInt(storage.get("otherQuestionSpeed")); // 其他答题延时

if (storage.get("welcome") != "true") {
    alert("必读说明", "免责声明：\n本程序只供个人学习Auto.js使用，不得盈利传播，不得用于违法用途，否则造成的一切后果自负！\n如果继续使用此应用即代表您同意此协议\n说明：此应用仅适用于Android7.0以上的版本。\n打开应用后请先点击第一个按钮打开无障碍和悬浮窗权限，如果没有反应则是已经开启。\n随后点击默认执行按钮，程序会自动检测当前分数智能执行\n如果您要使用自定义执行及单个任务执行功能，请先在数据配置页配置数据\n正常执行可得42分\n请确保进入学习强国时位于 主界面，模拟点击从主界面开始");
    //files.createWithDirs("/sdcard/auto-xxqg/log.txt");
    storage.put("aCount", 12);
    storage.put("aTime", 30);
    storage.put("aZX", 1);
    storage.put("vCount", 7);
    storage.put("vTime", 60);
    storage.put("lCount", 1);
    storage.put("zCount", 2);
    storage.put("color", "#009688");
    storage.put("zsyNext", 2);
    storage.put("zsyWaitTime", 2);
    storage.put("swipeTimes", 2);
    storage.put("onlineTiKuUrl1", "https://tiku.3141314.xyz");
    storage.put("videoChoose", 1);
    storage.put("questionAswerLowSpeed", 400);
    storage.put("questionAswerHighSpeed", 500);
    storage.put("otherQuestionSpeed", 2);
    storage.put("welcome", "true");
    storage.put("cChoose", 1);
    storage.put('tikuCustom', 0);
    storage.put('oU', 'http://127.0.0.1:34567');
    storage.put('tikuPercent', 0.1);
}

//设置日志目录
console.setGlobalLogConfig({
    "file": "/sdcard/autoStudyPro/log.txt"
});

/*
<---------------UI部分开始--------------->
*/

/*------------卡密------------*/
"ui";

var flag = false;

function pswd() {

    //获取之前输入的卡密
    var storage = storages.create("data");
    var pswd = storage.get("pswd", " ");
    //toast(pswd);
    let url = "https://pro.3141314.xyz/getCode.php?mode=uploadID&pswd=" + pswd;
    var checkId = http.get(url);
    var s = checkId.body.json();

    //toastLog(s.code);
    if (s.code == 200) {
        toast("卡密正确");
        return false;
    } else {
        toast(s.reason);
        return true;
    }
}

function start() {
    thread = threads.start(function() {
        if (!files.exists("/sdcard/autoStudyPro/bg.jpg")) {
            var bgUrl = "https://bing.ioliu.cn/v1/rand?w=" + deviceWidth + "&h=" + deviceHeight;
            var bgImg = images.load(bgUrl);
            images.save(bgImg, "/sdcard/autoStudyPro/bg.jpg", "jpg");
        }
    });
    if (pswd()) {
        showLoginUI();
    } else {
        getNotice();
    }
}

function getNotice() {
    var storage = storages.create("data");
    var nT = storage.get("noticeTime", 0);
    //toast(pswd);
    let url = "https://pro.3141314.xyz/getCode.php?mode=getNoticeTime";
    var checkId = http.get(url);
    var s = checkId.body.json();
    if (s > nT) showNoticeUI(s);
    else main();
}

function showNoticeUI(s) {
    var url = "https://pro.3141314.xyz/getCode.php?mode=getNT";
    var checkId = http.get(url);
    var NT = checkId.body.string();
    //toastLog(NT);
    url = "https://pro.3141314.xyz/getCode.php?mode=getNP";
    checkId = http.get(url);
    NP = checkId.body.string();
    //toastLog(NP);

    ui.layout(
        <frame>
            <img src="file:///sdcard/autoStudyPro/bg.jpg" scaleType="centerCrop" alpha="0.3" />
            
            <vertical h="*" w="*">
                
                <card w="*" margin="10 10" cardCornerRadius="2dp"
                cardElevation="10dp" foreground="?selectableItemBackground">
                <vertical h="auto" margin="10 20">
                    <text textSize="40sp" text="重要通知"/>
                    <text marginTop="15" id="noticeContent" />
                    <img src={NP} h="100" />
                </vertical>
            </card>
            
            <card w="*" margin="10 10" cardCornerRadius="2dp"
            cardElevation="10dp" foreground="?selectableItemBackground">
            <vertical h="auto" margin="10 20">
                <button style="Widget.AppCompat.Button.Colored" id="imsure" text="我已认真阅读并完全知悉且同意公告内容"/>
            </vertical>
        </card>
        
        </vertical>
        </frame>
    );

    ui.noticeContent.setText(NT);

    ui.imsure.on("click", () => {
        var storage = storages.create("data");
        storage.put("noticeTime", s);
        main();
    });
}

function showLoginUI() {
    ui.layout(
        <frame>
            <img src="file:///sdcard/autoStudyPro/bg.jpg" scaleType="centerCrop" alpha="0.3" />
            
            <vertical gravity="center" h="*" w="*">
                
                <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
                cardElevation="10dp" foreground="?selectableItemBackground">
                <vertical h="auto" align="center" margin="10 20">
                    
                    <linear>
                        <img src="file://icons/logo_icon.png" w="80" h="80" margin="10 0 0 20"/>
                        <text textSize="30sp">自动学习Pro</text>
                    </linear>
                    
                    <linear>
                        <text w="100" gravity="center" color="#111111" size="16">请输入卡密</text>
                        <input id="password" w="*" h="40" password="true"/>
                    </linear>
                    
                    <linear gravity="center">
                        <button id="login" text="确认"/>
                    </linear>
                </vertical>
            </card>
            
            
            <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
            cardElevation="10dp" foreground="?selectableItemBackground">
            <vertical h="auto" align="center" margin="10 20">
                <text text="卡密获取请前往公众号：校雷锋Pro" />
            </vertical>
        </card>
        
        </vertical>
        </frame>
    );

    ui.login.on("click", () => {
        var storage = storages.create("data");
        var pswd = ui.password.getText() + "";
        storage.put("pswd", pswd);
        start();
    });
}

start();

var thread = null;

/*-------悬浮窗---------*/
function floating() {
    sleep(1000);
    auto.waitFor();
    var storage = storages.create("强国学习配置");
    let window = floaty.window(
        <vertical>
            
            <button id="Bmin" text="移动/最小化" w="70" h="33" bg="#77ffffff" textColor="blue" textSize="10sp" />
            {/*<button id="move" text="长按移动" w="70" h="33" bg="#77ffffff" textColor="blue" textSize="10sp" />*/}
            <button id="switchXX" text="切到强国" w="70" h="33" bg="#77ffffff" textColor="blue" textSize="10sp" />
            <button id="startDZH" text="多账号" w="70" h="33" bg="#77ffffff" textColor="blue" textSize="10sp" />
            <button id="startLL" text="默认执行" w="70" h="33" bg="#77ffffff" textColor="blue" textSize="10sp" />
            {/* <button id="startDY" text=" 订阅 " w="70" h="33" bg="#77ffffff" textSize="10sp" /> */}
            <button id="startDT" text="挑战答题" w="70" h="33" bg="#77ffffff" textColor="blue" textSize="10sp" />
            <button id="startZSY" text="双人四人赛" w="70" h="33" bg="#77ffffff"  textColor="blue" textSize="10sp" />
            <button id="startMR" text="日周专答题" w="70" h="33" bg="#77ffffff" textColor="blue" textSize="10sp" />
            <button id="stop" text="停止" w="70" h="33" bg="#77ffffff" textColor="blue" textSize="10sp" />
            <button id="exit" text="关闭浮窗" w="70" h="33" bg="#77ffffff" textColor="red" textSize="10sp" />
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
    window.Bmin.setOnTouchListener(function(view, event) {
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
                    //toastLog(" 长按调整位置 ")
                    window.Bmin.click();
                }
                //return true;
        }
        return true;
    });

    //悬浮窗最小化
    function 最小化() {
        //if (storage.get("最小化")){
        window.Bmin.setText("≡|≡");
        window.setSize(windowWidth, 150);
        window.setPosition(0, 0);
        //window.setSize(windowWidth, 150);
        //window.setPosition(deviceWidth - windowWidth, deviceHeight - 150);
        //}
    }

    function 最大化() {
        //console.show();
        window.Bmin.setText("移动/最小化");
        window.setSize(windowWidth, windowHeight);
        //window.setPosition(deviceWidth - windowWidth, deviceHeight - windowHeight);
        window.setPosition(0, 0);
    }
    window.Bmin.click(() => {
        if (window.Bmin.text() == "移动/最小化") {
            最小化();
        } else {
            最大化();
        }
    });
    //启用按键监听，按下音量下键脚本结束
    /*threads.start(function() { //在子进程中运行监听事件
        events.observeKey();
        events.on("key", function(code, event) {
            var keyCodeStr = event.keyCodeToString(code);
            if (keyCodeStr == "KEYCODE_VOLUME_DOWN") {
                console.hide();
                alert("程序已结束。");
                exit();
            }
        });
    });*/
    var chide = storage.get("隐藏", false);
    if (chide) { //界面隐藏
        console.hide();
        //toastLog("开始学习。");
    } else {
        console.setPosition(0, device.height * 0.45); //部分华为手机console有bug请注释本行
        console.show(); //部分华为手机console有bug请注释本行
    }

    window.switchXX.click(() => {
        toastLog(" 切换到学习强国APP...");
        if (!launchApp("学习强国")) //启动学习强国app
        {
            console.error("找不到学习强国App!");
            //return;
        }
    });
    // 这个函数是对应悬浮窗的退出
    window.exit.click(() => {
        toastLog(" 退出！");
        console.hide();
        device.cancelKeepingAwake() //取消屏幕常亮
        exit();
    });


    //单账户一键学习
    window.startLL.click(() => {
        最小化();
        if (thread == null) {
            thread = threads.start(function() {
                toastLog(" 开启线程");
                main();
            });
        } else {
            toastLog(" 脚本运行中,正版免费正版更新勿信付费勿信破解");
        }
    });
    //多账号执行
    window.startDZH.click(() => {
        最小化();
        if (thread == null) {
            thread = threads.start(function() {
                toastLog(" 开启线程");
                sau();
            });
        } else {
            toastLog(" 脚本运行中,正版免费正版更新勿信付费勿信破解");
        }
    });

    //订阅
    /* window.startDY.click(() => {
        最小化();
        let ss = "./sub-quiz.js";
        startTh(ss);
    }); */

    //挑战答题
    window.startDT.click(() => {
        最小化();
        if (thread == null) {
            thread = threads.start(function() {
                toastLog(" 开启线程");
                func.start_app();
                func.challengeQuestion();
            });
        } else {
            toastLog(" 脚本运行中,正版免费正版更新勿信付费勿信破解");
        }
    });
    //争上游
    window.startZSY.click(() => {
        最小化();
        if (thread == null) {
            thread = threads.start(function() {
                toastLog(" 开启线程");
                func.start_app();
                competition.zsy();
                competition.SR();
            });
        } else {
            toastLog(" 脚本运行中,正版免费正版更新勿信付费勿信破解");
        }
    });
    //每日答题
    window.startMR.click(() => {
        最小化();
        if (thread == null) {
            thread = threads.start(function() {
                toastLog(" 开启线程");
                func.start_app();
                func.dailyQuestion();
                func.weeklyQuestion();
                func.specialQuestion();
            });
        } else {
            toastLog(" 脚本运行中,正版免费正版更新勿信付费勿信破解");
        }
    });

    //停止
    window.stop.click(() => {
        if (thread == null) {
            toastLog(" 没有进行中的脚本 ");
        } else {
            if (thread.isAlive()) {
                threads.shutDownAll();
                toastLog(" 已停止,程序免费请勿相信购买付费所得.");
            } else {
                toastLog(" 没有进行中的脚本 ");
            }
        }
    });
}

function 初始化() {
    aCatlog = ui.aCatlog.getText();
    date_string = parseInt(ui.date_string.getText());
    vCatlog = ui.vCatlog.getText();
    s = ui.s.getText();
    aCount = parseInt(ui.aCount.getText());
    aTime = parseInt(ui.aTime.getText());
    aZX = parseInt(ui.aZX.getText());
    vCount = parseInt(ui.vCount.getText());
    vTime = parseInt(ui.vTime.getText());
    lCount = parseInt(ui.lCount.getText());
    qCount = parseInt(ui.qCount.getText());
    zCount = parseInt(ui.zCount.getText());
    swipeTimes = parseInt(ui.swipeTimes.getText());
    onlineTiKuUrl1 = ui.tikuUrl.getText();
    questionAswerLowSpeed = parseInt(ui.lowSpeed.getText());
    questionAswerHighSpeed = parseInt(ui.highSpeed.getText());
    otherQuestionSpeed = parseInt(ui.otherQuestionSpeed.getText());
    oU = ui.oU.getText();
    tikuPercent = ui.tP.getText();
}


//alert("协议及说明", "免责声明：\n本程序只供个人学习Auto.js使用，不得盈利传播，不得用于违法用途，否则造成的一切后果自负！\n如果继续使用此应用即代表您同意此协议\n说明：此应用仅适用于Android7.0以上的版本。");

var color = storage.get("color");

//var txt = files.read("./运行日志.txt");
var dbName = "tiku.db"; //题库文件名
var path = files.path(dbName);
var db = SQLiteDatabase.openOrCreateDatabase(path, null);
var sql = "SELECT * FROM tiku;";
var cursor = db.rawQuery(sql, null);
if (cursor.moveToFirst()) {
    var answer = cursor.getString(0);
    cursor.close();
}

function main() {
    var storage = storages.create("data");
    var color = storage.get("color");

    ui.layout(
        <drawer id="drawer" >
            <vertical>
                <appbar bg="#009688">
                    <toolbar id="toolbar" title="自动学习Pro 定制版"/>
                    <tabs id="tabs"/>
                </appbar>
                <viewpager id="viewpager" >
                    <frame>
                        <img src="file:///sdcard/autoStudyPro/bg.jpg" scaleType="centerCrop" alpha="0.3" />
                        <ScrollView>
                            <vertical>
                                <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
                                cardElevation="10dp" foreground="?selectableItemBackground">
                                <vertical h="auto" align="center" margin="8 8">
                                    <Switch id='autoService' textColor="red" text='无障碍服务(请开启)' padding='8dp' textSize='15sp' checked='{{auto.service != null}}'>
                                    </Switch>
                                    <horizontal gravity="center">
                                        <button style="Widget.AppCompat.Button.Colored" id="BwindowService" text="悬浮窗" />
                                        <button style="Widget.AppCompat.Button.Colored" id="BfixService" text="修改权限(请开启)" />
                                        <button style="Widget.AppCompat.Button.Colored" id="addtg" text="加入tg群" />
                                    </horizontal>
                                    <horizontal >
                                        <text textSize="16sp" textColor="gray" text="  版本：" />
                                        <text id="aVER" textSize="16sp" textColor="red" text={app.versionName} />
                                    </horizontal>
                                    <horizontal>
                                        <text textSize="16sp" textColor="gray" text="  题库：" />
                                        <text id="total" textSize="16sp" textColor="red" />
                                    </horizontal>
                                </vertical>
                            </card>
                            <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
                            cardElevation="10dp" foreground="?selectableItemBackground">
                            <vertical h="auto" align="center" margin="8 8">
                                <button text="-------任务执行-------" style="Widget.AppCompat.Button.Borderless.Colored" w="*"/>
                                <button id="stop" w="*" text="停止所有任务" style="Widget.AppCompat.Button.Colored" />
                                <button style="Widget.AppCompat.Button.Colored" id="all" h="50" text="默认执行（判断积分执行）" />
                                <button id="sau" w="*" text="切换账户执行(为每个账户执行默认执行)" style="Widget.AppCompat.Button.Colored" />
                            </vertical>
                        </card>
                        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
                        cardElevation="10dp" foreground="?selectableItemBackground">
                        <vertical h="auto" align="center" margin="8 8">
                            <button text="-------以下为单个任务执行-------" style="Widget.AppCompat.Button.Borderless.Colored" w="*"/>
                            <horizontal>
                                <pref-checkbox id="cq" w="110" text="挑战答题"/>
                                <pref-checkbox id="dq" w="110" text="每日答题"/>
                                <pref-checkbox id="sr" w="110" text="双人对战"/>
                            </horizontal>
                            <horizontal>
                                <pref-checkbox id="zsy" w="110" text="四人赛"/>
                                <pref-checkbox id="dwz" w="110" text="读文章"/>
                                <pref-checkbox id="LTR" w="110" text="听广播"/>
                            </horizontal>
                            <horizontal>
                                <pref-checkbox id="ksp" w="110" text="看视频"/>
                                <pref-checkbox id="weekly" w="110" text="每周答题"/>
                                <pref-checkbox id="special" w="110" text="专项答题"/>
                            </horizontal>
                            <pref-checkbox id="CSA" text="收藏评论分享(已包含在读文章中)"/>
                            <button id="startToLearn" w="*" text="开始学习选中的内容（请在配置页面配置）" style="Widget.AppCompat.Button.Colored" />
                            <button id="sauc" w="*" text="切换账户执行(为每个账户执行选中的内容)" style="Widget.AppCompat.Button.Colored" />
                        </vertical>
                    </card>
                </vertical>
            </ScrollView>
        </frame>
        <frame>
            <img src="file:///sdcard/autoStudyPro/bg.jpg" scaleType="centerCrop" alpha="0.3" />
            <ScrollView>
                <vertical>
                    <button style="Widget.AppCompat.Button.Colored" id="save" h="50" text="保存当前配置" />
                    <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
                    cardElevation="10dp" foreground="?selectableItemBackground">
                    <vertical h="auto" align="center" margin="8 8">
                        <button text="-------软件配置-------" style="Widget.AppCompat.Button.Borderless.Colored" w="*"/>
                        <vertical>
                            <pref-checkbox id="update" text="关闭自动检查更新题库"/>
                            <pref-checkbox id="perf2" text="关闭悬浮窗"/>
                        </vertical>
                        <horizontal>
                            <text textSize="15sp" marginLeft="15" textColor="black" text="软件配色(保存后重启软件后生效):" />
                            <input id="bg" w="auto" h="auto" textSize="15sp" hint="默认#009688" />
                        </horizontal>
                    </vertical>
                </card>
                <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
                cardElevation="10dp" foreground="?selectableItemBackground">
                <vertical h="auto" align="center" margin="8 8">
                    <button text="-------OCR配置-------" style="Widget.AppCompat.Button.Borderless.Colored" w="*"/>
                    <horizontal>
                        <text textSize="15sp" marginLeft="15" textColor="black" text="ocr地址:" />
                        <input id="oU" w="auto" h="auto" w="*" textSize="15sp" />
                    </horizontal>
                    <horizontal>
                        <text textSize="15sp" marginLeft="15" textColor="black" text="选择ocr类型：" />
                        <radiogroup orientation="horizontal">
                            <radio id="wenocr" text="稳定版" />
                            <radio id="kuiaocr" text="快速版" />
                        </radiogroup>
                    </horizontal>
                    <horizontal>
                        <text textSize="15sp" marginLeft="15" textColor="black" text="当前选择的类型为：" />
                        <text id="tikuCustomShow" text="" textSize="15sp"/>
                    </horizontal>
                    <horizontal>
                        <text textSize="15sp" marginLeft="15" textColor="black" text="稳定版的识别率:" />
                        <input id="tP" w="auto" h="auto" w="*" textSize="15sp" />
                    </horizontal>
                </vertical>
            </card>
            <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
            cardElevation="10dp" foreground="?selectableItemBackground">
            <vertical h="auto" align="center" margin="8 8">
                <button text="-------自定义题库配置-------" style="Widget.AppCompat.Button.Borderless.Colored" w="*"/>
                <horizontal>
                    <text textSize="15sp" marginLeft="15" textColor="black" text="自定义题库地址:" />
                    <input id="tikuUrl" w="*" h="auto" hint="仅支持wanghuisenior类型在线题库" />
                </horizontal>
            </vertical>
        </card>
        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
        cardElevation="10dp" foreground="?selectableItemBackground">
        <vertical h="auto" align="center" margin="8 8">
            <button text="-------自定义读文章的配置-------" style="Widget.AppCompat.Button.Borderless.Colored" w="*"/>
            <horizontal>
                <text textSize="15sp" marginLeft="15" textColor="black" text="文章频道:" />
                <input id="aCatlog" w="auto" text="" textSize="15sp"/>
                <text textSize="15sp" marginLeft="15" textColor="black" text="日期:" />
                <input id="date_string" w="auto" text="" />
            </horizontal>
            <horizontal>
                <text textSize="15sp" marginLeft="15" textColor="black" text="文章数量:" />
                <input id="aCount" w="auto" text="" />
                <text textSize="15sp" marginLeft="15" textColor="black" text="时长:" />
                <input id="aTime" w="auto" text="" />
                <text textSize="15sp" marginLeft="15" textColor="black" text="执行:" />
                <input id="aZX" w="auto" text="" />
            </horizontal>
        </vertical>
        </card>
        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
        cardElevation="10dp" foreground="?selectableItemBackground">
        <vertical h="auto" align="center" margin="8 8">
            <button text="-------自定义看视频的配置-------" style="Widget.AppCompat.Button.Borderless.Colored" w="*"/>
            <horizontal>
                <text textSize="15sp" marginLeft="15" textColor="black" text="选择看视频类型：" />
                <radiogroup orientation="horizontal">
                    <radio id="vBaiLing" text="百灵视频" />
                    <radio id="vShiPin" text="普通视频" />
                </radiogroup>
            </horizontal>
            <horizontal>
                <text textSize="15sp" marginLeft="15" textColor="black" text="当前选择的看视频类型为：" />
                <text id="videoChooseShow" text="" textSize="15sp"/>
            </horizontal>
            <horizontal>
                <text textSize="15sp" marginLeft="15" textColor="black" text="视频频道:" />
                <input id="vCatlog" w="auto" text="" textSize="15sp" />
                <text textSize="15sp" marginLeft="15" textColor="black" text="关键词:" />
                <input id="s" w="auto" text="" textSize="15sp"/>
            </horizontal>
            <horizontal>
                <text textSize="15sp" marginLeft="15" textColor="black" text="视频数量:" />
                <input id="vCount" w="auto" text="" />
                <text textSize="15sp" marginLeft="15" textColor="black" text="时长:" />
                <input id="vTime" w="auto" text="" />
            </horizontal>
        </vertical>
        </card>
        <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
        cardElevation="10dp" foreground="?selectableItemBackground">
        <vertical h="auto" align="center" margin="8 8">
            <button text="-------自定义答题的配置-------" style="Widget.AppCompat.Button.Borderless.Colored" w="*"/>
            <vertical>
                <horizontal>
                    <text textSize="15sp" marginLeft="15" textColor="black" text="选择答题类型：" />
                    <radiogroup orientation="horizontal">
                        <radio id="cGradesV" text="稳定版" />
                        <radio id="cSpendV" text="快速版" />
                    </radiogroup>
                </horizontal>
                <horizontal>
                    <text textSize="15sp" marginLeft="15" textColor="black" text="当前选择的类型为：" />
                    <text id="cChooseShow" text="" textSize="15sp"/>
                </horizontal>
                
                <horizontal>
                    <text textSize="15sp" marginLeft="15" textColor="black" text="挑战次数:" />
                    <input id="lCount" w="auto" text="" />
                    <text textSize="15sp" marginLeft="15" textColor="black" text="答题:" />
                    <input id="qCount" w="auto" text="" />
                </horizontal>
                <horizontal>
                    <text textSize="15sp" marginLeft="15" textColor="black" text="四人双人答题延迟:" />
                    <input id="lowSpeed" w="auto" text="" />
                    <text textSize="15sp"  textColor="black" text="至" />
                    <input id="highSpeed" w="auto" text="" />
                    <text textSize="15sp" textColor="black" text="（毫秒）" />
                </horizontal>
                <horizontal>
                    <text textSize="15sp" marginLeft="15" textColor="black" text="其他（除四人双人外）答题延时:" />
                    <input id="otherQuestionSpeed" w="auto" text="" />
                    <text textSize="15sp" textColor="black" text="(秒)" />
                </horizontal>
                <horizontal>
                    <text textSize="15sp" marginLeft="15" textColor="black" text="四人赛次数:" />
                    <input id="zCount" w="auto" text="" />
                </horizontal>
                <horizontal>
                    <text textSize="15sp" marginLeft="15" textColor="black" text="每周专项翻动次数:" />
                    <input id="swipeTimes" w="auto" text="" />
                </horizontal>
            </vertical>
        </vertical>
        </card>
        </vertical>
        </ScrollView>
        </frame>
        <frame>
            <img src="file:///sdcard/autoStudyPro/bg.jpg" scaleType="centerCrop" alpha="0.3" />
            <ScrollView>
                <vertical>
                    <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
                    cardElevation="10dp" foreground="?selectableItemBackground">
                    <vertical h="auto" align="center" margin="8 8">
                        <vertical>
                            <horizontal gravity="center">
                                <input margin={margin + "px"} id="keyword" hint=" 输入题目或答案关键字" h="auto" />
                                <radiogroup orientation="horizontal">
                                    <radio id="rbQuestion" text="题目" checked="true" />
                                    <radio id="rbAnswer" text="答案" />
                                </radiogroup>
                            </horizontal>
                            <button gravity="center" id="search" text=" 搜索 " />
                            <horizontal gravity="center">
                                <button id="lastTen" text=" 最近十条 " />
                                <button id="prev" text=" 上一条 " />
                                <button id="next" text=" 下一条 " />
                                <button id="reset" text=" 重置 " />
                            </horizontal>
                            <horizontal gravity="center">
                                <button id="update" text=" 修改 " />
                                <button id="delete" text=" 删除 " />
                                <button id="insert" text=" 新增 " />
                                <button id="updateTikuNet" text=" 更新题库 " />
                            </horizontal>
                            <progressbar id="pbar" indeterminate="true" style="@style/Base.Widget.AppCompat.ProgressBar.Horizontal" />
                            <text id="resultLabel" text="" gravity="center" />
                            <horizontal>
                                <vertical>
                                    <text id="questionLabel" text="题目" />
                                    <horizontal>
                                        <text id="questionIndex" text="0" />
                                        <text id="slash" text="/" />
                                        <text id="questionCount" text="0" />
                                    </horizontal>
                                </vertical>
                                <input margin={margin + "px"} id="question" w="*" h="auto" />
                            </horizontal>
                            <horizontal>
                                <text id="answerLabel" text="答案" />
                                <input id="answer" w="*" h="auto" />
                            </horizontal>
                        </vertical>
                    </vertical>
                </card>
                <card w="*" h="auto" margin="10 5" cardCornerRadius="2dp"
                cardElevation="10dp" foreground="?selectableItemBackground">
                <vertical h="auto" align="center" margin="8 8">
                    <horizontal gravity="center">
                        <button id="daochu" text="导出文章列表" />
                        <button id="daoru" text="导入文章列表" />
                        <button id="listdel" text="清空文章列表" />
                    </horizontal>
                </vertical>
            </card>
            <button style="Widget.AppCompat.Button.Colored" id="tikuAdd" text="刷题浮窗" />
        </vertical>
        </ScrollView>
        </frame>
        <frame>
            <img src="file:///sdcard/autoStudyPro/bg.jpg" scaleType="centerCrop" alpha="0.3" />
            <webview id="webview" w="*" margin="1 1"/>
        </frame>
        <frame>
            <img src="file:///sdcard/autoStudyPro/bg.jpg" scaleType="centerCrop" alpha="0.3" />
            <list id="todoList">
                <card w="*" h="70" margin="10 5" cardCornerRadius="2dp"
                cardElevation="1dp" foreground="?selectableItemBackground">
                <horizontal gravity="center_vertical">
                    <View bg="#97ac69" h="*" w="10" />
                    <vertical padding="10 8" h="auto" w="0" layout_weight="1">
                        <text id="title" text="{{this.title}}" textColor="#222222" textSize="16sp" maxLines="1" />
                        <text text="{{this.summary}}" textColor="#999999" textSize="14sp" maxLines="1" />
                    </vertical>
                    <!--<checkbox id="done" marginLeft="4" marginRight="6" checked="{{this.done}}" />-->
                </horizontal>
                
            </card>
        </list>
        <fab id="add" w="auto" h="auto" src="@drawable/ic_add_black_48dp"
        margin="16" layout_gravity="bottom|right" tint="#ffffff" />
        </frame>
        </viewpager>
        </vertical>
        <vertical layout_gravity="left" bg="#ffffff" w="280">
            <img w="280" h="200" scaleType="fitXY" src="http://images.shejidaren.com/wp-content/uploads/2014/10/023746fki.jpg"/>
            <list id="menu">
                <horizontal bg="?selectableItemBackground" w="*">
                    <img w="50" h="50" padding="16" src="{{this.icon}}" tint="#009688"/>
                    <text textColor="black" textSize="15sp" text="{{this.title}}" layout_gravity="center"/>
                </horizontal>
            </list>
        </vertical>
        </drawer>
    );
    toast("ui finished");

    ui.webview.loadUrl("https://3141314.xyz");

    //检测更新和更新题库2021-5-22 xzy修改
    if (!PrefCheckBox.getPref().get("update")) {
        engines.execScriptFile("./update.js");
    }

    ui.total.setText(tikuCommon.allCaseNum("tiku") + "");
    ui.bg.setText(storage.get("color", "#009688"));
    ui.swipeTimes.setText(storage.get("swipeTimes", 5) + "");
    ui.tikuUrl.setText(storage.get("onlineTiKuUrl1", "https://tiku.3141314.xyz"));
    if (storage.get("videoChoose") == 1) {
        ui.videoChooseShow.setText("百灵视频");
    } else {
        ui.videoChooseShow.setText("普通视频");
    }
    if (storage.get("cChoose") == 1) {
        ui.cChooseShow.setText("稳定版");
    } else {
        ui.cChooseShow.setText("求速度");
    }
    if (storage.get("tikuCustom") == 1) {
        ui.tikuCustomShow.setText("稳定版");
    } else {
        ui.tikuCustomShow.setText("求速度");
    }

    ui.startToLearn.click(function() {
        thread = threads.start(function() {
            func.start_app();

            初始化();

            try {
                if (!requestScreenCapture()) {
                    toastLog("请求截图失败，停止执行！");
                    exit();
                }
            } catch (e) {
                console.error("[捕获错误] " + e);
            }

            if (PrefCheckBox.getPref().get("LTR"))
                func.listenToRadio();
            if (PrefCheckBox.getPref().get("CSA"))
                func.CollectAndShareAndComment();
            if (PrefCheckBox.getPref().get("weekly"))
                func.weeklyQuestion();
            if (PrefCheckBox.getPref().get("special"))
                func.specialQuestion();
            if (PrefCheckBox.getPref().get("zsy"))
                competition.zsy();
            toastLog("四人赛会影响整体刷分效果，请尽量单独执行！");
            if (PrefCheckBox.getPref().get("cq"))
                func.challengeQuestion();
            if (PrefCheckBox.getPref().get("dq"))
                func.dailyQuestion();
            if (PrefCheckBox.getPref().get("sr"))
                competition.SR();
            toastLog("双人对战会影响整体刷分效果，请尽量单独执行！");
            if (PrefCheckBox.getPref().get("dwz"))
                func.articleStudy();
            if (PrefCheckBox.getPref().get("ksp"))
                if (storage.get("videoChoose") == 1) {
                    func.videoStudy_bailing();
                } else {
                    func.videoStudy_news();
                }
            if (PrefCheckBox.getPref().get("LTR"))
                func.stopRadio();
            threads.shutDownAll();
            console.hide();
            engines.stopAll();
            exit();
        });
    });

    ui.sauc.click(function() {
        thread = threads.start(function() {
            初始化();
            customize_flag = true;
            launchApp("学习强国");
            sau();
            threads.shutDownAll();
            console.hide();
            engines.stopAll();
            exit();
        });
    });

    ui.tikuAdd.click(function() {
        初始化();
        engines.execScriptFile("./tiku-add.js");
    });

    var storageList = storages.create("todoList");
    //从storage获取todo列表
    var todoList = storageList.get("items", [{
        title: "请添加账户，请务必不要删除此条",
        summary: "点击加号添加，长按用户名删除"
    }]);

    ui.todoList.setDataSource(todoList);

    ui.todoList.on("item_long_click", function(e, item, i, itemView, listView) {
        confirm("确定要删除" + item.title + "吗？")
            .then(ok => {
                if (ok) {
                    todoList.splice(i, 1);
                }
            });
        e.consumed = true;
    });

    //当离开本界面时保存todoList
    ui.emitter.on("pause", () => {
        storageList.put("items", todoList);
    });

    ui.add.on("click", () => {
        dialogs.rawInput("请输入用户名(电话号码)")
            .then(title => {
                if (!title) {
                    return;
                }
                dialogs.rawInput("请输入密码")
                    .then(summary => {
                        todoList.push({
                            title: title,
                            summary: summary
                        });
                    });
            })
    });

    //一键加tg群
    ui.addtg.click(function() {
        toast("请自备VPN！");
        app.openUrl("https://t.me/auto_xxqg");
    })

    ui.BwindowService.click(() => { //悬浮窗权限
        //alert('如果修改悬浮窗权限崩溃，请手动给予权限。')
        /*app.startActivity({
            packageName: "com.android.settings",
            className: "com.android.settings.Settings$OverlaySettingsActivity",
            data: "package:" + context.getPackageName(),
        });
        */
        threads.start(function() {
            floating();
        });
    });
    //修改系统权限服务
    ui.BfixService.click(() => {
        app.startActivity({
            packageName: "com.android.settings",
            className: "com.android.settings.Settings$WriteSettingsActivity",
            data: "package:" + context.getPackageName(),
        });
    });
    ui.autoService.on("check", function(checked) {
        // 用户勾选无障碍服务的选项时，跳转到页面让用户去开启
        if (checked && auto.service == null) {
            app.startActivity({
                action: "android.settings.ACCESSIBILITY_SETTINGS"
            });
        }
        if (!checked && auto.service != null) {
            auto.service.disableSelf();
        }
    });
    ui.emitter.on("resume", function() {
        // 此时根据无障碍服务的开启情况，同步开关的状态
        ui.autoService.checked = auto.service != null;
    });

    //创建选项菜单(右上角)
    ui.emitter.on("create_options_menu", menu => {
        menu.add("协议");
        menu.add("关于");
        menu.add("说明");
    });
    //监听选项菜单点击
    ui.emitter.on("options_item_selected", (e, item) => {
        switch (item.getTitle()) {
            case "协议":
                alert("协议", "免责声明：本程序只供个人学习Auto.js使用，不得盈利传播，不得用于违法用途，否则造成的一切后果自负！\n如果继续使用此应用即代表您同意此协议");
                break;
            case "关于":
                alert("关于", "自动学习Pro v1.0.0，autoStudyPro开发团队制作");
                break;
            case "说明":
                alert("使用说明",
                    "〇程序需要 悬浮窗 和 无障碍权限（设置→辅助功能→无障碍→本 APP）\n 〇程序工作原理为模拟点击，基于Auto.js框架+JavaScript脚本执行 \n 〇程序支持每周答题，专项答题，暂不支持订阅。正常执行完毕42分\n 〇积分判断执行：读取今日积分确定需执行任务，任务精准，但部分手机可能不支持(积分获取正常推荐使用) \n 〇循序依次执行：预置每日积分所需执行任务数，不判断积分，依次执行所有任务(积分获取返回null或报错使用) \n ◎请确保进入学习强国时位于 主界面，模拟点击从主界面开始 \n ◎因存在文章误点击视频，多次重复点击同一文章视频问题，有概率造成循环执行，请手动补学 \n ◎安卓版本低于安卓7，无法执行收藏评论转发，文章界面模拟滑动 \n ●免责声明：本程序只供个人学习Auto.js使用，不得盈利传播，不得用于违法用途，否则造成的一切后果自负！"
                );
                break;
        }
        e.consumed = true;
    });


    activity.setSupportActionBar(ui.toolbar);

    //设置滑动页面的标题
    ui.viewpager.setTitles(["自动", "配置", "题库", "官网", "账户管理"]);
    //让滑动页面和标签栏联动
    ui.tabs.setupWithViewPager(ui.viewpager);

    //让工具栏左上角可以打开侧拉菜单
    ui.toolbar.setupWithDrawer(ui.drawer);

    //进度条不可见
    ui.run(() => {
        ui.pbar.setVisibility(View.INVISIBLE);
    });

    ui.menu.setDataSource([{
            title: "官网： https://3141314.xyz",
            icon: "@drawable/ic_language_black_48dp"
        },
        {
            title: "退出",
            icon: "@drawable/ic_exit_to_app_black_48dp"
        }
    ]);

    ui.menu.on("item_click", item => {
        switch (item.title) {
            case "退出":
                ui.finish();
                break;
        }
    })

    var thread = null;

    //查询
    ui.search.click(() => {
        //预先初始化
        qaArray = [];
        threads.shutDownAll();
        ui.run(() => {
            ui.question.setText("");
            ui.answer.setText("");
            ui.questionIndex.setText("0");
            ui.questionCount.setText("0");
        });
        //查询开始
        threads.start(function() {
            if (ui.keyword.getText() != "") {
                var keyw = ui.keyword.getText();
                if (ui.rbQuestion.checked) { //按题目搜
                    var sqlStr = util.format("SELECT question,answer FROM tiku WHERE %s LIKE '%%%s%'", "question", keyw);
                } else { //按答案搜
                    var sqlStr = util.format("SELECT question,answer FROM tiku WHERE %s LIKE '%%%s%'", "answer", keyw);
                }
                qaArray = tikuCommon.searchDb(keyw, "tiku", sqlStr);
                var qCount = qaArray.length;
                if (qCount > 0) {
                    ui.run(() => {
                        ui.question.setText(qaArray[0].question);
                        ui.answer.setText(qaArray[0].answer);
                        ui.questionIndex.setText("1");
                        ui.questionCount.setText(String(qCount));
                    });
                } else {
                    toastLog("未找到");
                    ui.run(() => {
                        ui.question.setText("未找到");
                    });
                }
            } else {
                toastLog("请输入关键字");
            }
        });
    });

    //最近十条
    ui.lastTen.click(() => {
        threads.start(function() {
            var keyw = ui.keyword.getText();
            qaArray = tikuCommon.searchDb(keyw, "", "SELECT question,answer FROM tiku ORDER BY rowid DESC limit 10");
            var qCount = qaArray.length;
            if (qCount > 0) {
                //toastLog(qCount);
                ui.run(() => {
                    ui.question.setText(qaArray[0].question);
                    ui.answer.setText(qaArray[0].answer);
                    ui.questionIndex.setText("1");
                    ui.questionCount.setText(qCount.toString());
                });
            } else {
                toastLog("未找到");
                ui.run(() => {
                    ui.question.setText("未找到");
                });
            }
        });
    });

    //上一条
    ui.prev.click(() => {
        threads.start(function() {
            if (qaArray.length > 0) {
                var qIndex = parseInt(ui.questionIndex.getText()) - 1;
                if (qIndex > 0) {
                    ui.run(() => {
                        ui.question.setText(qaArray[qIndex - 1].question);
                        ui.answer.setText(qaArray[qIndex - 1].answer);
                        ui.questionIndex.setText(String(qIndex));
                    });
                } else {
                    toastLog("已经是第一条了！");
                }
            } else {
                toastLog("题目为空");
            }
        });
    });

    //下一条
    ui.next.click(() => {
        threads.start(function() {
            if (qaArray.length > 0) {
                //toastLog(qaArray);
                var qIndex = parseInt(ui.questionIndex.getText()) - 1;
                if (qIndex < qaArray.length - 1) {
                    //toastLog(qIndex);
                    //toastLog(qaArray[qIndex + 1].question);
                    ui.run(() => {
                        ui.question.setText(qaArray[qIndex + 1].question);
                        ui.answer.setText(qaArray[qIndex + 1].answer);
                        ui.questionIndex.setText(String(qIndex + 2));
                    });
                } else {
                    toastLog("已经是最后一条了！");
                }
            } else {
                toastLog("题目为空");
            }
        });
    });

    //修改
    ui.update.click(() => {
        threads.start(function() {
            if (ui.question.getText() && qaArray.length > 0 && parseInt(ui.questionIndex.getText()) > 0) {
                var qIndex = parseInt(ui.questionIndex.getText()) - 1;
                var questionOld = qaArray[qIndex].question;
                var questionStr = ui.question.getText();
                var answerStr = ui.answer.getText();
                var sqlstr = "UPDATE tiku SET question = '" + questionStr + "' , answer = '" + answerStr + "' WHERE question=  '" + questionOld + "'";
                tikuCommon.executeSQL(sqlstr);
            } else {
                toastLog("请先查询");
            }
        });
    });

    //删除
    ui.delete.click(() => {
        threads.start(function() {
            if (qaArray.length > 0 && parseInt(ui.questionIndex.getText()) > 0) {
                var qIndex = parseInt(ui.questionIndex.getText()) - 1;
                var questionOld = qaArray[qIndex].question;
                var sqlstr = "DELETE FROM tiku WHERE question = '" + questionOld + "'";
                tikuCommon.executeSQL(sqlstr);
                iff = iff - 1;
                files.write("./if.txt", iff);
            } else {
                toastLog("请先查询");
            }
        });
    });

    //新增
    ui.insert.click(() => {
        threads.start(function() {
            if (ui.question.getText() != "" && ui.answer.getText() != "") {
                var questionStr = ui.question.getText();
                var answerStr = ui.answer.getText();
                var sqlstr = "INSERT INTO tiku VALUES ('" + questionStr + "','" + answerStr + "','')";
                tikuCommon.executeSQL(sqlstr);
                checkAndUpdate(questionStr, answerStr);
                iff++;
                files.write("./if.txt", iff);
            } else {
                toastLog("请先输入 问题 答案");
            }
        });
    });

    function reset() {

    }
    //重置
    ui.reset.click(() => {
        threads.shutDownAll();
        threads.start(function() {
            qaArray = [];
            ui.run(() => {
                ui.keyword.setText("");
                ui.question.setText("");
                ui.answer.setText("");
                ui.questionIndex.setText("0");
                ui.questionCount.setText("0");
                ui.rbQuestion.setChecked(true);
            });
            toastLog("重置完毕!");
        });
    });

    //更新网络题库
    ui.updateTikuNet.click(() => {
        dialogs.build({
                title: "更新网络题库",
                content: "确定更新？",
                positive: "确定",
                negative: "取消",
            })
            .on("positive", update)
            .show();

        function update() {
            threads.start(function() {
                /* ui.run(() => {
                    ui.resultLabel.setText("正在更新网络题库...");
                    ui.pbar.setVisibility(View.VISIBLE);
                }); */
                engines.execScriptFile("./update.js");
            });
        }
    });


    var path = files.path("tiku.db");

    ui.listdel.click(() => {
        var db = SQLiteDatabase.openOrCreateDatabase(path, null);
        var Deletelistable = "DELETE FROM learnedArticles";
        db.execSQL(Deletelistable);
        db.close();
        toastLog("已清空文章阅读记录!");
    })

    ui.vBaiLing.on("check", (checked) => {
        if (checked) {
            videoChoose = 1;
            var storage = storages.create("data");
            storage.put("videoChoose", 1);
        }
    });
    ui.vShiPin.on("check", (checked) => {
        if (checked) {
            videoChoose = 2;
            var storage = storages.create("data");
            storage.put("videoChoose", 2);
        }
    });

    ui.cGradesV.on("check", (checked) => {
        if (checked) {
            cChoose = 1;
            var storage = storages.create("data");
            storage.put("cChoose", 1);
        }
    });
    ui.cSpendV.on("check", (checked) => {
        if (checked) {
            cChoose = 2;
            var storage = storages.create("data");
            storage.put("cChoose", 2);
        }
    });

    ui.wenocr.on("check", (checked) => {
        if (checked) {
            tikuCustom = 1;
            var storage = storages.create("data");
            storage.put("tikuCustom", 1);
        }
    });
    ui.kuiaocr.on("check", (checked) => {
        if (checked) {
            tikuCustom = 0;
            var storage = storages.create("data");
            storage.put("tikuCustom", 0);
        }
    });

    ui.daochu.click(() => {
        dialogs.build({
            title: "提示",
            content: "这个操作会备份已学文章的数据库到\n/sdcard/Download文件夹下",
            positive: "确定",
        }).show();
        files.copy(path, "/sdcard/Download/tiku.db");
        toastLog("已将数据库复制到/sdcard/Download文件夹下");
    });

    ui.daoru.click(() => {
        dialogs.build({
                title: "提示",
                content: "请确认文件已经放在\n/sdcard/Download文件夹下\n导入后会删除导出的文件！！\n如果需要请先备份！！",
                positive: "确定",
                negative: "取消",
            }).on("positive", copy)
            .show();

        function copy() {
            files.copy("/sdcard/Download/tiku.db", path);
            toastLog("导入成功！");
            files.remove("/sdcard/Download/tiku.db")
        }
    });

    ui.save.click(function() {
        初始化();

        if (questionAswerLowSpeed > questionAswerHighSpeed) {
            toast("保存失败！四人双人答题延时后面延时不能低于前面延时");
            return;
        }

        var storage = storages.create("data");
        storage.put("aCount", aCount);
        storage.put("aTime", aTime);
        storage.put("aZX", aZX);
        storage.put("vCount", vCount);
        storage.put("vTime", vTime);
        storage.put("lCount", lCount);
        storage.put("zCount", zCount);
        storage.put("color", String(ui.bg.getText()));
        storage.put("swipeTimes", swipeTimes);
        storage.put("onlineTiKuUrl1", String(onlineTiKuUrl1));
        storage.put("questionAswerLowSpeed", questionAswerLowSpeed);
        storage.put("questionAswerHighSpeed", questionAswerHighSpeed);
        storage.put("otherQuestionSpeed", otherQuestionSpeed);
        storage.put('oU', oU);
        storage.put('tikuPercent', tikuPercent);

        toast("保存成功！");
    });


    ui.all.click(function() {
        if (thread != null && thread.isAlive()) {
            alert("注意", "脚本正在运行，请结束之前进程");
            return;
        }
        toast("开始积分判断运行");
        thread = threads.start(function() {
            初始化();
            func.main();
        });
    });

    ui.sau.click(function() { //切换账户
        auto.waitFor(); //等待获取无障碍辅助权限
        if (thread != null && thread.isAlive()) {
            alert("注意", "脚本正在运行，请结束之前进程");
            return;
        }
        thread = threads.start(function() {
            flagShut = 1;
            初始化();
            //start_app();
            console.show();
            launchApp("学习强国");
            sau();
            threads.shutDownAll();
            console.hide();
            engines.stopAll();
            exit();
        });
    });

    ui.stop.click(function() {
        if (thread != null && thread.isAlive()) {
            threads.shutDownAll();
            toast("停止运行！")
            console.hide();
        } else {
            toast("没有线程在运行！")
        }
    });

    ui.aCatlog.setText(aCatlog.toString());
    ui.date_string.setText(date_string.toString());
    ui.aCount.setText(aCount.toString());
    ui.aTime.setText(aTime.toString());
    ui.aZX.setText(aZX.toString());
    ui.vCatlog.setText(vCatlog.toString());
    ui.s.setText(s.toString());
    ui.vCount.setText(vCount.toString());
    ui.vTime.setText(vTime.toString());
    ui.lCount.setText(lCount.toString());
    ui.qCount.setText(qCount.toString());
    ui.zCount.setText(zCount.toString());
    ui.lowSpeed.setText(questionAswerLowSpeed.toString());
    ui.highSpeed.setText(questionAswerHighSpeed.toString());
    ui.otherQuestionSpeed.setText(otherQuestionSpeed.toString());
    ui.oU.setText(oU);
    ui.tP.setText(tikuPercent.toString());
}

/**
 * @description: 自动切换账户执行函数
 * @param: todoList-账户列表
 * @return: null
 */
function sau() {
    console.show();
    try {
        if (!requestScreenCapture()) {
            toastLog("请求截图失败，停止执行！");
            exit();
        }
    } catch (e) {
        console.error("[捕获错误] " + e);
    }
    var storageList = storages.create("todoList");
    //从storage获取todo列表
    var todoList = storageList.get("items", [{
        title: "请添加账户，请务必不要删除此条",
        summary: "点击加号添加，长按用户名删除"
    }]);
    var path = files.path("tiku.db");
    JSON.stringify(todoList);
    var todoListLength = func.getJsonLength(todoList);
    toast(todoListLength);
    if (todoListLength <= 1) {
        alert("请先到账户配置页面添加账户！");
        launchApp("内测版");
        return 0;
    }
    log("等待打开学习强国");
    while (true) {
        if (id("home_bottom_tab_icon_large").exists()) {
            break;
        }
        if (id("btn_next").exists()) {
            break;
        }
    }
    //while(!id("home_bottom_tab_icon_large").exists() || !id("btn_next").exists());
    var i = 1;
    //toast(todoListLength);
    while (i < todoListLength) {
        log("开始第" + i + "个账户的执行，用户名:" + todoList[i].title);
        if (id("home_bottom_tab_icon_large").exists()) {
            log("还没有退出登录，自动退出");
            id("comm_head_xuexi_mine").findOne().click();
            while (!id("my_setting").exists());
            id("my_setting").findOne().click();
            func.delay(2);
            click("退出登录");
            func.delay(2);
            click("确认");
        }
        log("等待登陆按钮出现");
        while (!id("user_avatar_login_tv").exists());
        log("登录");
        setText(0, todoList[i].title);
        setText(1, todoList[i].summary);
        id("btn_next").findOne().click();
        log("等待加载出主页");
        while (!id("home_bottom_tab_icon_large").exists());
        if (customize_flag == true) {
            if (PrefCheckBox.getPref().get("LTR"))
                func.listenToRadio();
            if (PrefCheckBox.getPref().get("CSA"))
                func.CollectAndShareAndComment();
            if (PrefCheckBox.getPref().get("weekly"))
                func.weeklyQuestion();
            if (PrefCheckBox.getPref().get("special"))
                func.specialQuestion();
            if (PrefCheckBox.getPref().get("zsy"))
                competition.zsy();
            toastLog("四人赛会影响整体刷分效果，请尽量单独执行！");
            if (PrefCheckBox.getPref().get("cq"))
                func.challengeQuestion();
            if (PrefCheckBox.getPref().get("dq"))
                func.dailyQuestion();
            if (PrefCheckBox.getPref().get("sr"))
                competition.SR();
            toastLog("双人对战会影响整体刷分效果，请尽量单独执行！");
            if (PrefCheckBox.getPref().get("dwz"))
                func.articleStudy();
            if (PrefCheckBox.getPref().get("ksp"))
                if (storage.get("videoChoose") == 1) {
                    func.videoStudy_bailing();
                } else {
                    func.videoStudy_news();
                }
            if (PrefCheckBox.getPref().get("LTR"))
                func.stopRadio();
            var db = SQLiteDatabase.openOrCreateDatabase(path, null);
            var Deletelistable = "DELETE FROM learnedArticles";
            db.execSQL(Deletelistable);
            db.close();
            toastLog("已清空文章阅读记录!");
        } else {
            log("开始判断积分执行");
            初始化();
            func.main();
            var db = SQLiteDatabase.openOrCreateDatabase(path, null);
            var Deletelistable = "DELETE FROM learnedArticles";
            db.execSQL(Deletelistable);
            db.close();
            toastLog("已清空文章阅读记录!");
        }
        func.delay(2);
        i = i + 1;
    }
}