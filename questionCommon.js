var tikuCommonZsy = require("./tikuCommon-zsy.js");
var tikuCommon = require("./tikuCommon.js");
storage = storages.create("data");
var delaytime1 = storage.get("questionAswerLowSpeed", 520);
var delaytime2 = storage.get("questionAswerHighSpeed", 620);
var delaytime3 = storage.get("questionAswerAddSpeed", 1000);
var delaytime3 = Number(delaytime3);
delaytime2 = Number(delaytime2);
delaytime1 = Number(delaytime1);
var oldaquestion; //四人赛（争上游）和对战答题循环，定义旧题目对比新题目用20201022
var ZiXingArray = ["选择词语的正确词形。", "选择正确的读音。", "下列不属于二十四史的是。", "下列不属于“十三经”的是。", "下列说法正确的是。", "下列词形正确的是。", "下列读音正确的是。", ];
//特殊题，特点：题目一样，答案不同
var chutiIndexArray = ["（出题：", "（出题单位：", "推荐单位：", "出题：", "来源：《", "（来源：", "来源：", "（推荐：", "推荐："]; //去除题目中尾巴（非题目内容）
var opabcd = ["A", "B", "C", "D"];
var oU = storage.get('oU', 'http://127.0.0.1:34567');
//var qCount = random(5, 7);//挑战答题每轮答题数(5~7随机)
/*************************************************公共部分******************************************************/
/**
 * @description: 延时函数
 * @param: seconds-延迟秒数
 * @return: null
 */
function delay(seconds) {
    sleep(1000 * seconds); //sleep函数参数单位为毫秒所以乘1000
}

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
 * @description: 返回字段首字母序号
 * @param: str
 * @return: int 字母序号
 */
function indexFromChar(str) {
    return str.charCodeAt(0) - "A".charCodeAt(0);
}

/**
 * @description: 返回字段首字母
 * @param: int 字母序号
 * @return: str
 */
function charFromIndex(int) {
    return String.fromCharCode("A".charCodeAt(0) + int);
}

/*************************************************挑战答题部分******************************************************/
/**
 * @description: 答错后查找正确答案
 * @param: delayTime, myColor, myThreshold, listArray, options
 * @return: correctAns 正确答案
 */
function findCorrectAnswer(delayTime, myColor, myThreshold, listArray, options) {
    console.hide(); //隐藏console控制台窗口
    sleep(delayTime); //等待截屏
    var img = captureScreen(); //截个屏
    // let imgName = "/sdcard/好好学习/ddd" + new Date().getTime() + ".png";
    // let imgName = "/sdcard/好好学习/ddd.png";
    // captureScreen(imgName);//截个屏
    // var img = images.read(imgName);
    // toastLog(imgName);
    console.show(); //显示console控制台窗口
    //delay(3);
    // 查找绿色答案#f24650
    var correctAns = new Array();
    listArray.some(item => {
        var listBounds = item.bounds();
        // console.log(listBounds);
        var point = findColor(img, myColor, {
            region: [listBounds.left, listBounds.top, listBounds.right - listBounds.left, listBounds.bottom - listBounds.top],
            threshold: myThreshold
        });
        if (point) {
            correctAns.push(options[listArray.indexOf(item)]);
            correctAns.push(charFromIndex(listArray.indexOf(item)));
            toastLog(correctAns);
            return true;
        } else {
            // console.log("没找到");
        }
    });
    return correctAns;
}

/**
 * @description: 每次答题循环
 * @param: conNum 连续答对的次数
 * @return: null
 */
function challengeQuestionLoop(conNum, qCount) {
    delaytime4 = randomNum(delaytime1 + delaytime3, delaytime2 + delaytime3) //随机延迟增加设定毫秒数
    console.log("延时：" + delaytime4);
    sleep(delaytime4);
    if (conNum >= qCount) //答题次数足够退出，每轮5次
    {
        let listArray = className("ListView").findOnce().children(); //题目选项列表
        let i = random(0, listArray.length - 1);
        console.log("本轮次数足够，随机点击一个答案，答错进入下一轮");
        listArray[i].child(0).click(); //随意点击一个答案
        console.log("----------------------------------");
        return;
    }
    if (className("ListView").exists()) {
        var question = className("ListView").findOnce().parent().child(0).text();
        console.log((conNum + 1).toString() + ".题目：" + question);
    } else {
        console.error("提取题目失败!");
        let listArray = className("ListView").findOnce().children(); //题目选项列表
        let i = random(0, listArray.length - 1);
        console.log("随机点击一个");
        listArray[i].child(0).click(); //随意点击一个答案
        return;
    }

    var chutiIndex = question.lastIndexOf("出题单位");
    if (chutiIndex != -1) {
        question = question.substring(0, chutiIndex - 2);
    }

    question = question.replace(/\s/g, "");

    var options = []; //选项列表
    if (className("ListView").exists()) {
        className("ListView").findOne().children().forEach(child => {
            var answer_q = child.child(0).child(1).text();
            options.push(answer_q);
        });
    } else {
        console.error("答案获取失败!");
        return;
    }

    //特殊情况外理
    ZiXingArray.forEach(item => { //特殊题目+来源
        if (question.indexOf(item) > -1) {
            question = question + options[0];
        }
    });

    var answer = tikuCommon.getAnswer(question, 'tiku');
    /* if (answer.length == 0) { //tiku表中没有则到tikuNet表中搜索答案
        answer = getAnswer(question, 'tikuNet');
    } */

    if (/^[a-zA-Z]{1}$/.test(answer)) { //如果为ABCD形式
        var indexAnsTiku = indexFromChar(answer.toUpperCase());
        answer = options[indexAnsTiku];
        toastLog("answer from char=" + answer);
    }

    let hasClicked = false;
    var listArray = className("ListView").findOnce().children(); //题目选项列表
    if ((answer == "") || !textEndsWith(answer).exists()) //如果没找到答案
    {
        let i = random(0, listArray.length - 1);
        console.error("没有找到答案，随机点击一个");
        listArray[i].child(0).click(); //随意点击一个答案

        var delayTime = 120;
        var myColor = "#44BF78";
        var myThreshold = 4;
        var correctAns = findCorrectAnswer(delayTime, myColor, myThreshold, listArray, options);
        console.info("正确答案是:" + correctAns[0]);
        hasClicked = true;
        // 更新题库
        // delay(1);
        if (correctAns == "" || correctAns == null || correctAns == undefined) //如果答案不是null，就更新题库
        {
            console.error("没有准确得到答案,跳过更新题库。");
        } else {
            if (answer == "") {
                var sql = "INSERT INTO tiku (question, option, answer, wrongAnswer) VALUES ('" + question + "','" + correctAns[1] + "','" + correctAns[0] + "','')";
            } else {
                var sql = "UPDATE tiku SET answer='" + correctAns[0] + "' option='" + correctAns[1] + "' WHERE question LIKE '" + question + "'";
            }
            // console.log(correctAns);
            tikuCommon.insertOrUpdate(sql);
            console.log("更新题库答案...");
            updateToServer(question, correctAns[0]);
        }
    } else //如果找到了答案
    {
        /* listArray.some(item => {
            var listDescStr = item.child(0).child(1).text();
            console.error(deleteNO(listDescStr));
            if (deleteNO(listDescStr) == answer) {
                item.child(0).click(); //点击答案
                hasClicked = true;
                rightCount++;
                console.log("-------------------------------");
                return true;
            }
        }); */
        console.info("答案：" + answer);
        var optletters = charFromIndex(options.indexOf(answer));
        // toastLog(optletters);
        var sql = "UPDATE tiku SET  option='" + optletters + "' WHERE question LIKE '" + question + "'";
        tikuCommon.insertOrUpdate(sql);
        // console.log("更新题库答案...");
        text(answer).click();
        hasClicked = true;
        console.log("-------------------------------");

        /* var delayTime = 120;
            var myColor = "#44BF78";
            var myThreshold = 4;
            var correctAns = findCorrectAnswer(delayTime, myColor, myThreshold, listArray, options);
        

            delay(1);
            if (text("v5IOXn6lQWYTJeqX2eHuNcrPesmSud2JdogYyGnRNxujMT8RS7y43zxY4coWepspQkvw" +
                    "RDTJtCTsZ5JW+8sGvTRDzFnDeO+BcOEpP0Rte6f+HwcGxeN2dglWfgH8P0C7HkCMJOAAAAAElFTkSuQmCC").exists()) //遇到❌号，则答错了,不再通过结束本局字样判断
            {
                // var sql = "DELETE FROM tiku WHERE question = '" + question + "'";
                // tikuCommon.insertOrUpdate(sql);
                // toastLog("答案有误，删除此题！");
                console.info("正确答案是:" + correctAns);
                let sql = "UPDATE tiku SET answer='" + correctAns + "' WHERE question LIKE '" + question + "'";
                tikuCommon.tikuCommon.insertOrUpdate(sql);
                toastLog("答案有误，已更正答案！");
            }  */
    }
    if (!hasClicked) //如果没有点击成功
    {
        console.error("未能成功点击，随机点击一个");
        let i = random(0, listArray.length - 1);
        listArray[i].child(0).click(); //随意点击一个答案
        console.log("-------------------------------");
    }
}
/*************************************************挑战答题部分  2021.4.28新循环***************************************************/

/**
 * @description: 挑战答题循环
 * @param: conNum 连续答对的次数
 * @return: null
 */
function challengeQuestionLoopnew(conNum) {
    try {
        let ClickAnswer; //定义已点击答案
        if (conNum >= qCount) //答题次数足够退出，每轮qCount=5+随机1-3次
        {
            let listArray = className("ListView").findOnce().children(); //题目选项列表
            let i = random(0, listArray.length - 1);
            console.log("本轮答题数足够，随机点击答案");
            var question = className("ListView").findOnce().parent().child(0).text();
            question = question.replace(/\s/g, "");
            var options = []; //选项列表
            if (className("ListView").exists()) {
                className("ListView").findOne().children().forEach(child => {
                    var answer_q = child.child(0).child(1).text();
                    options.push(answer_q);
                });
            } else {
                console.error("答案获取失败!");
                return;
            } //20201217添加 极低概率下，答题数足够，下一题随机点击，碰到字形题
            ZiXingArray.forEach(item => { //特殊题目+来源
                if (question.indexOf(item) > -1) {
                    question = question + options[0];
                }
            });
            console.log((conNum + 1).toString() + ".随机点击题目：" + question);
            delay(random(0.5, 1)); //随机延时0.5-1秒
            listArray[i].child(0).click(); //随意点击一个答案
            ClickAnswer = listArray[i].child(0).child(1).text();; //记录已点击答案
            console.log("随机点击:" + ClickAnswer);
            //如果随机点击答案正确，则更新到本地题库tiku表
            delay(0.5); //等待0.5秒，是否出现X
            if (!text("v5IOXn6lQWYTJeqX2eHuNcrPesmSud2JdogYyGnRNxujMT8RS7y43zxY4coWepspQkvw" +
                    "RDTJtCTsZ5JW+8sGvTRDzFnDeO+BcOEpP0Rte6f+HwcGxeN2dglWfgH8P0C7HkCMJOAAAAAElFTkSuQmCC").exists() || text("再来一局").exists()) //遇到❌号，则答错了,不再通过结束本局字样判断
            {
                console.log("更新本地题库答案...");
                checkAndUpdate(question, answer, ClickAnswer);
                updateToServer(question, answer);
            }
            console.log("-------------");
            return;
        }
        if (className("ListView").exists()) {
            var question = className("ListView").findOnce().parent().child(0).text();
        } else {
            console.error("提取题目失败!");
            let listArray = className("ListView").findOnce().children(); //题目选项列表
            let i = random(0, listArray.length - 1);
            console.log("随机点击");
            delay(random(0.5, 1)); //随机延时0.5-1秒
            listArray[i].child(0).click(); //随意点击一个答案
            return;
        }
        var chutiIndex = question.lastIndexOf("出题单位");
        if (chutiIndex != -1) {
            question = question.substring(0, chutiIndex - 2);
        }
        question = question.replace(/\s/g, "");
        var options = []; //选项列表
        if (className("ListView").exists()) {
            className("ListView").findOne().children().forEach(child => {
                var answer_q = child.child(0).child(1).text();
                options.push(answer_q);
            });
        } else {
            console.error("答案获取失败!");
            return;
        }
        //  if (question == ZiXingTi.replace(/\s/g, "") || question == DuYinTi.replace(/\s/g, "") || question == ErShiSiShi.replace(/\s/g, "") || question == ZiXingTi1.replace(/\s/g, "") || question == DuYinTi1.replace(/\s/g, "") || question == Shisanjing.replace(/\s/g, "")) {
        //    question = question + options[0]; //字形题 读音题 在题目后面添加第一选项               
        //              }
        ZiXingArray.forEach(item => { //特殊题目+来源
            if (question.indexOf(item) > -1) {
                question = question + options[0];
            }
        });
        console.log((conNum + 1).toString() + "搜库题目：" + question);
        var answer = tikuCommon.getAnswer(question, 'tiku');
        //if (answer.length == 0) {//tiku表中没有则到tikuNet表中搜索答案
        //    answer = tikuCommon.getAnswer(question, 'tikuNet');
        //}
        console.info("答案：" + answer);
        if (/^[a-zA-Z]{1}$/.test(answer)) { //如果为ABCD形式
            var indexAnsTiku = indexFromChar(answer.toUpperCase());
            answer = options[indexAnsTiku];
            toastLog("answer from char=" + answer);
        }
        let hasClicked = false;
        let listArray = className("ListView").findOnce().children(); //题目选项列表
        if (answer == "") //如果没找到答案
        {
            let i = random(0, listArray.length - 1);
            console.error("没有找到答案，随机点击");
            delay(random(0.5, 1)); //随机延时0.5-1秒
            listArray[i].child(0).click(); //随意点击一个答案
            /*******以下代码为获取提示的答案并保存题库 2021.4.29修改 */
            var delayTime = 120;
            var myColor = "#44BF78";
            var myThreshold = 4;
            var correctAns = findCorrectAnswer(delayTime, myColor, myThreshold, listArray, options);
            console.info(correctAns);
            console.info("正确答案是:" + correctAns[0]);
            hasClicked = true;
            // 更新题库
            // delay(1);
            if (correctAns == "" || correctAns == null || correctAns == undefined) //如果答案不是null，就更新题库
            {
                console.error("没有准确得到答案,跳过更新题库。");
            } else {
                if (answer == "") {
                    var sql = "INSERT INTO tiku (question, option, answer, wrongAnswer) VALUES ('" + question + "','" + correctAns[1] + "','" + correctAns[0] + "','')";
                } else {
                    var sql = "UPDATE tiku SET answer='" + correctAns[0] + "' option='" + correctAns[1] + "' WHERE question LIKE '" + question + "'";
                }
                // console.log(correctAns);
                tikuCommon.insertOrUpdate(sql);
                console.log("更新题库答案...");
                updateToServer(question, correctAns[0]);
            }
            /*******代码为获取提示的答案并保存题库代码结束 */
            {
                /*}原代码屏蔽
                         ClickAnswer = listArray[i].child(0).child(1).text();;//记录已点击答案
                         hasClicked = true;
                         console.log("随机点击:"+ClickAnswer);//如果随机点击答案正确，则更新到本地题库tiku表
                        delay(0.5);//等待0.5秒，是否出现X
                        if (!text("v5IOXn6lQWYTJeqX2eHuNcrPesmSud2JdogYyGnRNxujMT8RS7y43zxY4coWepspQkvw" +
                             "RDTJtCTsZ5JW+8sGvTRDzFnDeO+BcOEpP0Rte6f+HwcGxeN2dglWfgH8P0C7HkCMJOAAAAAElFTkSuQmCC").exists() || text("再来一局").exists())//遇到❌号，则答错了,不再通过结束本局字样判断
                         { console.log("更新本地题库答案...");
                           checkAndUpdate(question, answer, ClickAnswer);
                         }
                        */
            }
            console.log("-------------");
        } else //如果找到了答案
        {
            listArray.forEach(item => {
                var listDescStr = item.child(0).child(1).text();
                if (listDescStr == answer) {
                    delay(random(0.5, 1)); //随机延时0.5-1秒
                    item.child(0).click(); //点击答案
                    hasClicked = true;
                    delay(0.5); //等待0.5秒，是否出现X
                    if (!text("v5IOXn6lQWYTJeqX2eHuNcrPesmSud2JdogYyGnRNxujMT8RS7y43zxY4coWepspQkvw" +
                            "RDTJtCTsZ5JW+8sGvTRDzFnDeO+BcOEpP0Rte6f+HwcGxeN2dglWfgH8P0C7HkCMJOAAAAAElFTkSuQmCC").exists() || text("再来一局").exists()) //遇到❌号，则答错了,不再通过结束本局字样判断
                    {
                        console.log("题库答案正确……");
                    }
                    if (text("v5IOXn6lQWYTJeqX2eHuNcrPesmSud2JdogYyGnRNxujMT8RS7y43zxY4coWepspQkvw" +
                            "RDTJtCTsZ5JW+8sGvTRDzFnDeO+BcOEpP0Rte6f+HwcGxeN2dglWfgH8P0C7HkCMJOAAAAAElFTkSuQmCC").exists() || text("再来一局").exists()) //遇到❌号，则答错了,不再通过结束本局字样判断
                    {
                        console.error("题库答案错误!!!");
                        /*checkAndUpdate(question, answer, ClickAnswer);*/
                    }
                    console.log("-------------");
                }
            });
        }
        if (!hasClicked) //如果没有点击成功
        { //因导致不能成功点击问题较多，故该部分不更新题库，大部分问题是题库题目适配为填空题或多选题或错误选项
            console.error("未能成功点击，随机点击");
            let i = random(0, listArray.length - 1);
            delay(random(0.5, 1)); //随机延时0.5-1秒
            listArray[i].child(0).click(); //随意点击一个答案
            console.log("随机点击:" + ClickAnswer);
            delay(0.5); //等待0.5秒，是否出现X
            if (!text("v5IOXn6lQWYTJeqX2eHuNcrPesmSud2JdogYyGnRNxujMT8RS7y43zxY4coWepspQkvw" +
                    "RDTJtCTsZ5JW+8sGvTRDzFnDeO+BcOEpP0Rte6f+HwcGxeN2dglWfgH8P0C7HkCMJOAAAAAElFTkSuQmCC").exists() || text("再来一局").exists()) //遇到❌号，则答错了,不再通过结束本局字样判断
            {
                console.log("随机点击正确……");
            }
            if (text("v5IOXn6lQWYTJeqX2eHuNcrPesmSud2JdogYyGnRNxujMT8RS7y43zxY4coWepspQkvw" +
                    "RDTJtCTsZ5JW+8sGvTRDzFnDeO+BcOEpP0Rte6f+HwcGxeN2dglWfgH8P0C7HkCMJOAAAAAElFTkSuQmCC").exists() || text("再来一局").exists()) //遇到❌号，则答错了,不再通过结束本局字样判断
            {
                console.error("随机点击错误!!!");
                /*checkAndUpdate(question, answer, ClickAnswer);*/
            }
            console.log("-------------");
        }
    } catch (e) {
        console.error("挑战答题错误，请手动处理！！");
        return;
    }
}

/*************************************************争上游、双人对战部分*************************************************/
/**
 * @description: 答题争上游、双人对战，去掉题目和答案前面的序号
 * @param: str 问题或答案
 * @return: 去掉序号后的题目或答案
 */
function deleteNO(str) {
    /* if (className("android.view.View").textStartsWith("距离答题结束").exists()) {
        // console.log(str.slice(3));
        return str.slice(3);
    } else {
        return str;
    } */
    return str.slice(3);
}

/*************************************************争上游答题部分******************************************************/
/**
 * @description: 双人对战答题循环
 * @param: conNum 连续答对的次数
 * @return: null
 */
function competitionLoop() {
    log("competitionLoop");
    delaytime4 = randomNum(delaytime1, delaytime2)
    sleep(200);
    var question = "";
    while (question == "") {
        if (text("100").depth(24).exists() || text("继续挑战").exists()) {
            toastLog("好像有人100了");
            return;
        }
        try {
            if (!className("RadioButton").exists() || className("android.view.View").text("继续挑战").exists() || textContains("继续挑战").exists() /*|| !textContains("距离答题结束").exists()*/ ) { //不存在本局结束标志 继续挑战，则执行  20201225界面变化，距离答题结束 删除
                return;
            }
            //while (!className("RadioButton").exists()); //@KB64ba建议使用while判断
            //if (className("android.view.View").depth(29).exists() && !text("继续挑战").exists()) {
            if (className("RadioButton").exists() || className("android.view.View").depth(29).exists()) {
                bquestion = className("android.view.View").depth(29).indexInParent(4).findOnce();
                if (bquestion !== null) {
                    for (i = 0; i < 6; i++) {
                        question = question + className("ListView").findOnce().parent().child(i).text();
                    }
                    n = 0;
                    while (className("ListView").findOnce().parent().child(0).text() == null) { //如果没有获取到序号，再获取题目一次。
                        question = "";
                        for (i = 0; i < 6; i++) {
                            question = question + className("ListView").findOnce().parent().child(i).text();
                        }
                        if (n = 3) {
                            continue
                        } //最多循环3次
                    }
                } else {
                    question = className("android.view.View").depth(29).findOnce().text();
                }
                if (question !== oldaquestion) {
                    oldaquestion = question;
                    console.log("题目：" + question);
                    question = deleteNO(question);
                    var chutiIndex = question.lastIndexOf("出题单位");
                    if (chutiIndex != -1) {
                        question = question.substring(0, chutiIndex - 2);
                    }

                    question = question.replace(/\s/g, "");
                    console.log("延时：" + delaytime4);
                    sleep(delaytime4);

                    // className("ListView").waitFor();
                    var listArray = className("ListView").findOnce().children(); //题目选项列表


                    //特殊情况外理
                    ZiXingArray.forEach(item => { //特殊题目+来源
                        if (question.indexOf(item) > -1) {
                            question = question + deleteNO(listArray[0].child(0).child(1).text());
                        }
                    });
                    log("awa");

                    var answer = getAnswer(question, 'tiku');
                    /* if (answer.length == 0) { //tiku表中没有则到tikuNet表中搜索答案
                        answer = getAnswer(question, 'tikuNet');
                    } */
                    log("awa");

                    /* 
                    if (/^[a-zA-Z]{1}$/.test(answer)) { //如果为ABCD形式
                        var indexAnsTiku = indexFromChar(answer.toUpperCase());
                        answer = listArray[indexAnsTiku].child(0).child(1).text();
                        answer = deleteNO(answer);
                        toastLog("answer from char=" + answer);
                    } */
                    if (question == "") {
                        console.error("提取题目失败!");
                        let i = random(0, listArray.length - 1);
                        console.log("随机点击");
                        listArray[i].child(0).click(); //随意点击一个答案
                        return false;
                    }

                    if (text("100").depth(24).exists() || text("继续挑战").exists()) {
                        toastLog("好像有人100了");
                        return;
                    }


                    let hasClicked = false;
                    // let listArray = className("ListView").findOnce().children(); //题目选项列表
                    if (answer == "") //如果没找到答案
                    {
                        let i = random(0, listArray.length - 1);
                        console.error("没有找到答案，随机点击一个");
                        listArray[i].child(0).click(); //随意点击一个答案
                        hasClicked = true;
                        ClickAnswer = listArray[i].child(0).child(1).text(); //记录已点击答案
                        console.log("随机点击:" + ClickAnswer);
                        console.log("-------------");
                        var options = []; //选项列表
                        while (options.length == 0) {
                            if (className("ListView").exists()) {
                                className("ListView").findOne().children().forEach(child => {
                                    var answer_q = child.child(0).child(1).text();
                                    options.push(answer_q);
                                });
                            } else {
                                console.error("答案列表获取失败!");
                                return false;
                            }
                        }

                        var delayTime = 1055;
                        var myColor = "#2BC87E";
                        var myThreshold = 25;
                        var correctAns = findCorrectAnswer(delayTime, myColor, myThreshold, listArray, options);

                        // 更新题库
                        // delay(1);
                        if (correctAns) //如果答案不是null，就更新题库
                        {
                            correctAns[0] = deleteNO(correctAns[0]);
                            console.info("正确答案是:" + correctAns[0]);
                            var sql = "INSERT INTO tiku (question, option, answer, wrongAnswer) VALUES ('" + question + "','" + correctAns[1] + "','" + correctAns[0] + "','')";
                            // console.log(correctAns);
                            tikuCommon.insertOrUpdate(sql);
                            console.log("更新题库答案...");
                        }
                        // if (correctAns[0] == deleteNO(options[i])) { //listArray[i].child(0).child(1).text()
                        //     return true;
                        // }
                        if (correctAns[0] == deleteNO(ClickAnswer)) { //listArray[i].child(0).child(1).text()
                            return true;
                        } else {
                            console.log("-------------------------------");
                            hasClicked = true;
                            return false;
                        }
                    } else //如果找到了答案
                    {
                        console.info("答案：" + answer);
                        /* listArray.some(item => {
                            var listDescStr = item.child(0).child(1).text();
                            console.error(deleteNO(listDescStr));
                            if (deleteNO(listDescStr) == answer) {
                                item.child(0).click(); //点击答案
                                hasClicked = true;
                                rightCount++;
                                console.log("-------------------------------");
                                return true;
                            }
                        }); */
                        if (textEndsWith(answer).exists()) {
                            /* var optletters = textEndsWith(answer).findOnce().text();
                            optletters = optletters[0];
                            toastLog(optletters); */
                            sleep(30)
                            log("imhere");
                            textEndsWith(answer).click();
                            hasClicked = true;
                            if (!textContains(answer).exists()) { //如果列表里没有找到的答案，说明题库答案错误
                                console.error("题库答案错误，请手动修改题库！随意点击一个答案。");
                                let i = random(0, listArray.length - 1);
                                listArray[i].child(0).click(); //随意点击一个答案
                            }
                            console.log("-------------------------------");
                            return true;
                        }
                    }
                    //console.error(hasClicked);
                    if (!hasClicked) //如果没有点击成功
                    {
                        console.error("未能成功点击，随机点击一个");
                        let i = random(0, listArray.length - 1);
                        listArray[i].child(0).click(); //随意点击一个答案
                        console.log("-------------------------------");
                    }
                    return false;
                }
                question = "";
            } else {
                // console.error("提取题目失败!");
                let listArray = className("ListView").findOnce().children(); //题目选项列表
                let i = random(0, listArray.length - 1);
                console.log("随机点击一个");
                listArray[i].child(0).click(); //随意点击一个答案
                return false;
            }
        } catch (e) {
            return false;
        }
        // delay(0.1);
    }


}




/*************************************************降胜率循环部分******************************************************/

/**
 * @description: 降胜率答题循环
 * @param: conNum 连续答对的次数
 * @return: null
 */
function competitionLoopnew(conNum) {
    delaytime4 = randomNum(delaytime1, delaytime2)
    sleep(20);
    var question = "";
    while (question == "") {
        if (text("100").depth(24).exists() || text("继续挑战").exists()) {
            toastLog("好像有人100了");
            return;
        }
        try {
            if (!className("RadioButton").exists() || className("android.view.View").text("继续挑战").exists() || textContains("继续挑战").exists() /*|| !textContains("距离答题结束").exists()*/ ) { //不存在本局结束标志 继续挑战，则执行  20201225界面变化，距离答题结束 删除
                return;
            }
            if (className("RadioButton").exists() || className("android.view.View").depth(29).exists()) {
                bquestion = className("android.view.View").depth(29).indexInParent(4).findOnce();
                if (bquestion !== null) {
                    for (i = 0; i < 6; i++) {
                        question = question + className("ListView").findOnce().parent().child(i).text();
                    }
                    n = 0;
                    while (className("ListView").findOnce().parent().child(0).text() == null) { //如果没有获取到序号，再获取题目一次。
                        question = "";
                        for (i = 0; i < 6; i++) {
                            question = question + className("ListView").findOnce().parent().child(i).text();
                        }
                        if (n = 3) {
                            continue
                        } //最多循环3次
                    }
                    //console.error("来源题："+question);
                    //sleep(2000);
                } else {
                    question = className("android.view.View").depth(29).findOnce().text();
                }
                if (question !== oldaquestion) {
                    oldaquestion = question;
                    console.log("题目：" + question);
                    question = deleteNO(question);

                    var chutiIndex = question.lastIndexOf("出题单位");
                    if (chutiIndex != -1) {
                        question = question.substring(0, chutiIndex - 2);
                    }

                    question = question.replace(/\s/g, "");


                    // className("ListView").waitFor();
                    console.log("延时：" + delaytime4);
                    sleep(delaytime4);
                    var listArray = className("ListView").findOnce().children(); //题目选项列表


                    //特殊情况外理
                    ZiXingArray.forEach(item => { //特殊题目+来源
                        if (question.indexOf(item) > -1) {
                            question = question + deleteNO(listArray[0].child(0).child(1).text());
                        }
                    });

                    var answer = tikuCommon.getAnswer(question, 'tiku');
                    if (!textContains(answer).exists()) { //如果列表里没有找到的答案，说明题库答案错误
                        hasClicked = false;
                        console.error("题库答案错误，请手动修改题库，删除该题！");
                    }
                    if (question == "") {
                        console.error("提取题目失败!");
                        let i = random(0, listArray.length - 1);
                        console.log("随机点击");
                        listArray[i].child(0).click(); //随意点击一个答案
                        return;
                    }

                    if (text("100").depth(24).exists() || text("继续挑战").exists()) {
                        toastLog("好像有人100了");
                        return;
                    }


                    let hasClicked = false;
                    // let listArray = className("ListView").findOnce().children(); //题目选项列表
                    if (answer == "") //如果没找到答案
                    {
                        let i = random(0, listArray.length - 1);
                        console.error("没有找到答案，随机点击一个");
                        listArray[i].child(0).click(); //随意点击一个答案
                        hasClicked = true;
                        ClickAnswer = listArray[i].child(0).child(1).text();; //记录已点击答案
                        console.log("随机点击:" + ClickAnswer);
                        console.log("-------------");
                        var options = []; //选项列表
                        while (options.length == 0) {
                            if (className("ListView").exists()) {
                                className("ListView").findOne().children().forEach(child => {
                                    var answer_q = child.child(0).child(1).text();
                                    options.push(answer_q);
                                });
                            } else {
                                console.error("答案列表获取失败!");
                                return false;
                            }
                        }

                        var delayTime = 1055;
                        var myColor = "#2BC87E";
                        var myThreshold = 25;
                        var correctAns = findCorrectAnswer(delayTime, myColor, myThreshold, listArray, options);

                        // 更新题库
                        // delay(1);
                        if (correctAns) //如果答案不是null，就更新题库
                        {
                            correctAns[0] = deleteNO(correctAns[0]);
                            console.info("正确答案是:" + correctAns[0]);
                            var sql = "INSERT INTO tiku (question, option, answer, wrongAnswer) VALUES ('" + question + "','" + correctAns[1] + "','" + correctAns[0] + "','')";
                            // console.log(correctAns);
                            tikuCommon.insertOrUpdate(sql);
                            console.log("更新题库答案...");
                            updateToServer(question, correctAns[0]);
                        }
                        if (correctAns[0] == deleteNO(ClickAnswer)) { //listArray[i].child(0).child(1).text()
                            return true;
                        } else {
                            hasClicked = true;
                            return false;
                        }
                    } else //如果找到了答案
                    {
                        console.info("答案：" + answer);
                        if (text("100").depth(24).exists() || text("继续挑战").exists()) {
                            toastLog("好像有人100了");
                            return;
                        }
                        console.warn("---降胜率：我就乱点---");
                        let listArray = className("ListView").findOnce().children(); //题目选项列表
                        let i = random(0, listArray.length - 1);
                        listArray[i].child(0).click(); //随意点击一个答案
                        ClickAnswer = listArray[i].child(0).child(1).text();; //记录已点击答案
                        if (answer == deleteNO(ClickAnswer)) {
                            return true;
                        } else {
                            hasClicked = true;
                            return false;
                        }
                    }
                }
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
        // delay(0.1);
    }
    if (text("100").depth(24).exists() || text("继续挑战").exists()) {
        toastLog("好像有人100了");
        return;
    }

}

/**************************  2021.4.28使用新循环****************************************** */
function getQuestion(img) {
    var imgClip = images.inRange(img, '#000000', '#444444');
    var imgBase = images.toBase64(imgClip);
    //img.recycle(); //回收图片，防止内存泄露，但是我发现加上后速度更慢，因此注释。
    toastLog("I'm getting ocr text!");
    
    //获取ocr结果
    let resobj = OCR.Ocr(imgClip);
    log(resobj);
    
    var timu = "";
    var words_list = resobj;
    
    for (var i in words_list) {
        // 如果是选项则后面不需要读取
        if (words_list[i].label[0] == "A") break;
        // 如果两词块之间有分割线，则不读取
        // 利用location之差判断是否之中有分割线
        /**
         * rect:
         * 识别到的文字块的区域位置信息，列表形式，
         * 分别表示文字块4个顶点的（x,y）坐标；采用图像坐标系，
         * 图像坐标原点为图像左上角，x轴沿水平方向，y轴沿竖直方向。
         *  
         判断条件： Math.abs(words_list[i].rect[0][0] - words_list[i - 1].rect[0][0]) > 100
         */
        if (words_list[0].label[1] == '.' && i > 0) break;
        timu += words_list[i].label;
    }
    timu = timu.slice(timu.indexOf('.') + 1);
    timu = timu.replace(/\s*/g, "");
    timu = timu.replace(/,/g, "，");
    timu = timu.replace(/o/g, "。");
    timu = timu.replace(/O/g, "。");
    timu = timu.replace(/"/, "“");
    timu = timu.replace(/"/g, "”");
    timu = timu.replace(/'/, "“");
    timu = timu.replace(/'/g, "”");
    timu = timu.replace(/\(/g, "（");
    timu = timu.replace(/\)/g, "）");
    return timu;
}

/**
 * @description: 争上游答题 双人对战答题循环
 * @param: null
 * @return: null
 */
function zsyQuestionLoop() {
    let ClickAnswer;
    try { //20201025使用try catch(e)语句处理错误，去除前后置0.5s延时   
        /*delay(0.5);*/ //4-0.5，前置0.5延时判断结束标志
        if (!className("RadioButton").exists() || className("android.view.View").text("继续挑战").exists() || textContains("继续挑战").exists() /*|| !textContains("距离答题结束").exists()*/ ) { //不存在本局结束标志 继续挑战，则执行  20201225界面变化，距离答题结束 删除
            /*console.info("答题结束!");*/ //配合20201225界面变化 距离答题结束 去除，本语句去除
            return;
        } else {
            log("开始获取题目");
            while (!className("RadioButton").exists()); //@KB64ba建议使用while判断
            if (className("RadioButton").exists() || question.length == 0) {
                // var bounds = className("ListView").findOnce().parent().bounds();
                // var imgScreen = captureScreen(); //请求截取当前屏幕
                // var imgclip = images.clip(imgScreen, bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
                // var question = getQuestion(imgclip);
                var question = getQuestion(captureScreen());
            }
            log("获取完题目了");

            console.log("题目:" + question);
            var answer_list = getAnswer(question, 'tiku');
            var answer = answer_list[1];
            var answer_content = answer_list[0];
            console.info("答案：" + answer_content);

            if (answer == ' ') {
                let i = random(0, listArray.length - 1);
                console.error("没有找到答案，随机点击");
                className('android.widget.RadioButton').depth(32).findOne().click();
                console.log("随机点击");
                console.log("-------------");
            } else { //如果找到了答案 该部分问题: 选项带A.B.C.D.，题库返回答案不带，char返回答案带
                log("本地答案：" + answer_content);
                //等待选项加载
                className('android.widget.RadioButton').depth(32).waitFor();
                try {
                    className('android.widget.RadioButton').depth(32).findOnce(answer.charCodeAt(0) - 65).click();
                    log("点击成功");
                    log("---------------");
                } catch (error) {
                    // 如果选项不存在，则点击第一个
                    if (className('android.widget.RadioButton').depth(32).exists()) {
                        log("答案：选项不存在，点击A");
                        className('android.widget.RadioButton').depth(32).findOne().click();
                        log("点击成功");
                        log("---------------");
                    }
                }
            }
            // 等待下一题加载
            do {
                var point = findColor(captureScreen(), '#555AB6', {
                    region: [device.width * distance1 / width, device.height * distance2 / height,
                        device.width * (1 - 2 * distance1 / width), device.height * (1 - distance2 / height - distance3 / height)
                    ],
                    threshold: 10,
                });
            } while (!point);
            delay(0.1);
        }
    } catch (e) {
        //console.log("错误捕获(不用管):" + e)
        delay(3);
        if (!className("RadioButton").exists() || className("android.view.View").text("继续挑战").exists() || textContains("继续挑战").exists() /*|| !textContains("距离答题结束").exists()*/ ) { //不存在本局结束标志 继续挑战，则执行  
            /*console.info("答题结束!");*/ //配合20201225界面变化 距离答题结束 删除，本语句删除
            return;
        }
    }
}

/*************************************************每日答题部分***************************************************/
/**
 * @description: 获取填空题题目数组
 * @param: null
 * @return: questionArray
 */
function getFitbQuestion() {
    var questionCollections = className("EditText").findOnce().parent().parent();
    var questionArray = [];
    var findBlank = false;
    var blankCount = 0;
    var blankNumStr = "";
    var i = 0;
    questionCollections.children().forEach(item => {
        if (item.className() != "android.widget.EditText") {
            if (item.text() != "") { //题目段
                if (findBlank) {
                    blankNumStr = "|" + blankCount.toString();
                    questionArray.push(blankNumStr);
                    findBlank = false;
                }
                questionArray.push(item.text());
            } else {
                findBlank = true;
                blankCount = (className("EditText").findOnce(i).parent().childCount() - 1);
                i++;
            }
        }
    });
    /* questionArray.forEach( item=> {
        console.log(item);
    }) */
    return questionArray;
}

/**
 * @description: 获取选择题题目数组
 * @param: null
 * @return: questionArray
 */
function getChoiceQuestion() {
    var questionCollections = className("ListView").findOnce().parent().child(1);
    var questionArray = [];
    questionArray.push(questionCollections.text());
    return questionArray;
}


/**
 * @description: 获取提示字符串
 * @param: null
 * @return: tipsStr
 */
function getTipsStr() {
    var tipsStr = "";
    while (tipsStr == "") {
        if (text("查看提示").exists()) {
            var seeTips = text("查看提示").findOnce();
            seeTips.click();
            delay(1);
            click(device.width * 0.5, device.height * 0.41);
            delay(1);
            click(device.width * 0.5, device.height * 0.35);
        } else {
            console.error("未找到查看提示");
        }
        if (text("提示").exists()) {
            var tipsLine = text("提示").findOnce().parent();
            //获取提示内容
            if (tipsLine.parent().child(1).child(0).text() == "") {
                var tipsViewArray = tipsLine.parent().child(1).child(0).children();
            } else {
                var tipsViewArray = tipsLine.parent().child(1).children();
            }
            tipsViewArray.forEach(item => {
                if (item.text().substr(0, 2) != "——" || item.text().substr(0, 2) != "--" || item.text().substr(0, 2) != "来源") {
                    tipsStr += item.text();
                }
            })
            // console.log("提示：" + tipsStr);
            //关闭提示
            tipsLine.child(1).click();
            //if (text("查看提示").exists()) {back();}
            break;
        }
        delay(1);
    }
    return tipsStr;
}


/**
 * @description: 从提示中获取填空题答案
 * @param: timu, tipsStr
 * @return: ansTips
 */
function getAnswerFromTips(timu, tipsStr) {
    var ansTips = "";
    for (var i = 1; i < timu.length - 1; i++) {
        if (timu[i].charAt(0) == "|") {
            var blankLen = timu[i].substring(1);
            var indexKey = tipsStr.indexOf(timu[i + 1]);
            var ansFind = tipsStr.substr(indexKey - blankLen, blankLen);
            ansTips += ansFind;
        }
    }
    return ansTips;
}

/**
 * @description: 根据提示点击选择题选项
 * @param: tipsStr
 * @return: clickStr
 */
function clickByTips(tipsStr) {
    var clickStr = "";
    var correctAnswerStr = "";
    var isFind = false;
    if (className("ListView").exists()) {
        var listArray = className("ListView").findOne().children();
        listArray.forEach(item => {
            var ansStr = item.child(0).child(2).text();
            if (tipsStr.indexOf(ansStr) >= 0) {
                item.child(0).click();
                clickStr += item.child(0).child(1).text().charAt(0);
                correctAnswerStr = ansStr;
                isFind = true;
            }
        });
        if (!isFind) { //没有找到 随机点击一个
            console.error("未能成功点击，随机点击一个");
            let i = random(0, listArray.length - 1);
            listArray[i].child(0).click();
            clickStr += listArray[i].child(0).child(1).text().charAt(0);
            correctAnswerStr = listArray[i].child(0).child(2).text();
        }
    }
    if (textStartsWith("单选题").exists()) {
        return correctAnswerStr;
    } else {
        return clickStr;
    }
}


/**
 * @description: 根据答案点击选择题选项
 * @param: answer
 * @return: null
 */
function clickByAnswer(answer) {
    var hasClicked = false;
    if (className("ListView").exists()) {
        var listArray = className("ListView").findOnce().children();
        listArray.forEach(item => {
            var listIndexStr = item.child(0).child(1).text().charAt(0);
            //单选答案为非ABCD
            var listDescStr = item.child(0).child(2).text();
            // console.log(listDescStr)
            if (answer == listDescStr) {
                item.child(0).click();
                hasClicked = true;
            } else if (answer.indexOf(listIndexStr) >= 0) {
                item.child(0).click();
                hasClicked = true;
            }
        });
        if (!hasClicked) { //没有找到 随机点击一个
            console.error("未能成功点击，随机点击一个");
            let i = random(0, listArray.length - 1);
            listArray[i].child(0).click();
            // clickStr += listArray[i].child(0).child(1).text().charAt(0);
            // correctAnswerStr = listArray[i].child(0).child(2).text();
        }
    }
}

/**
 * @description: 检查答案是否正确，并更新数据库
 * @param: question, ansTiku, answer
 * @return: null
 */
function checkAndUpdate(question, ansTiku, answer) {
    try {
        if (text("下一题").exists() || text("完成").exists()) { //答错了
            swipe(100, device.height - 100, 100, 100, 500);
            var nCount = 0
            while (nCount < 5) {
                if (textStartsWith("正确答案").exists()) {
                    var correctAns = textStartsWith("正确答案").findOnce().text().substr(6);
                    if (textStartsWith("单选题").exists()) {
                        //单选题选项
                        var optletters = correctAns;
                        // 单选题答案
                        var alpha = "ABCDEF";
                        let indexList = alpha.indexOf(correctAns);
                        var listArray = className("ListView").findOne().children();
                        // 找到答案项
                        correctAns = listArray[indexList].child(0).child(2).text();
                    }
                    console.info("正确答案是：" + correctAns);
                    if (ansTiku == "") { //题库为空则插入正确答案                
                        var sql = "INSERT INTO tiku (question, option, answer, wrongAnswer) VALUES ('" + question + "','" + optletters + "','" + correctAns + "','')";
                    } else { //更新题库答案
                        var sql = "UPDATE tiku SET answer='" + correctAns + "' option='" + optletters + "' WHERE question LIKE '" + question + "'";
                    }
                    tikuCommon.insertOrUpdate(sql);
                    console.log("更新题库答案...");
                    updateToServer(question, correctAns);
                    delay(1);
                    break;
                } else {
                    var clickPos = className("android.webkit.WebView").findOnce().child(2).child(0).child(1).bounds();
                    click(clickPos.left + device.width * 0.13, clickPos.top + device.height * 0.1);
                    console.error("未捕获正确答案，尝试修正");
                }
                nCount++;
            }
            if (className("Button").exists()) {
                className("Button").findOnce().click();
            } else {
                click(device.width * 0.85, device.height * 0.06);
            }
        } else { //正确后进入下一题，或者进入再来一局界面
            if (ansTiku == "" && answer != "") { //正确进入下一题，且题库答案为空              
                var sql = "INSERT INTO tiku (question, option, answer, wrongAnswer) VALUES ('" + question + "', '','" + answer + "','')";
                tikuCommon.insertOrUpdate(sql);
                console.log("更新题库答案...");
                updateToServer(question, answer);
            }
        }
    } catch (e) {
        return;
    }

}


/**
 * @description: 每日答题循环
 * @param: null
 * @return: null
 */
function dailyQuestionLoop() {
    delaytime4 = randomNum(delaytime1 + delaytime3, delaytime2 + delaytime3)
    console.log("延时：" + delaytime4);
    if (textStartsWith("填空题").exists()) {
        var questionType = "填空题："; //questionType题型是什么
        var questionArray = getFitbQuestion();
        //console.log('填空题')
    } else if (textStartsWith("多选题").exists()) {
        var questionType = "多选题：";
        var questionArray = getChoiceQuestion();
        //console.log('选择题')
    } else if (textStartsWith("单选题").exists()) {
        var questionType = "单选题：";
        var questionArray = getChoiceQuestion();
    }

    var blankArray = [];
    var question = "";
    questionArray.forEach(item => {
        if (item != null && item.charAt(0) == "|") { //是空格数
            blankArray.push(item.substring(1));
        } else { //是题目段
            question += item;
        }
    });
    question = question.replace(/\s/g, "");
    console.log(questionType + question);
    // 特殊情况外理
    let specialQuestion = ["选择词语的正确词形。", "选择正确的读音。"]
    if (specialQuestion.indexOf(question) > -1) {
        question = question + className("ListView").findOnce().child(0).child(0).child(2).text();
    }
    var ansTiku = tikuCommon.getAnswer(question, 'tiku');

    /* if (ansTiku.length == 0) {//tiku表中没有则到tikuNet表中搜索答案
        ansTiku = getAnswer(question, 'tikuNet');
    } */
    var answer = ansTiku.replace(/(^\s*)|(\s*$)/g, "");

    if (textStartsWith("填空题").exists()) {
        if (answer == "") {
            var tipsStr = getTipsStr();
            answer = getAnswerFromTips(questionArray, tipsStr);
            console.info("提示中的答案：" + answer);
            setText(0, answer.substr(0, blankArray[0]));
            if (blankArray.length > 1) {
                for (var i = 1; i < blankArray.length; i++) {
                    setText(i, answer.substr(blankArray[i - 1], blankArray[i]));
                }
            }
        } else {
            console.info("答案：" + answer);
            setText(0, answer.substr(0, blankArray[0]));
            if (blankArray.length > 1) {
                for (var i = 1; i < blankArray.length; i++) {
                    setText(i, answer.substr(blankArray[i - 1], blankArray[i]));
                }
            }
        }
    } else if (textStartsWith("多选题").exists() || textStartsWith("单选题").exists()) {
        if (answer == "") {
            var tipsStr = getTipsStr();
            answer = clickByTips(tipsStr);
            console.info("提示中的答案：" + answer);
        } else {
            console.info("答案：" + ansTiku);
            clickByAnswer(answer);
        }
    }

    delay(1.5);

    if (text("确定").exists()) {
        text("确定").click();
        delay(0.5);
    } else if (text("下一题").exists()) {
        click("下一题");
        delay(0.5);
    } else if (text("完成").exists()) {
        text("完成").click();
        delay(0.5);
    } else {
        console.warn("未找到右上角确定按钮控件，根据坐标点击");
        click(device.width * 0.85, device.height * 0.06); //右上角确定按钮，根据自己手机实际修改
    }

    checkAndUpdate(question, ansTiku, answer);
    console.log("---------------------");
    delay(2);
}

function updateToServer(question, answer) {
    console.info("开始上传");
    var res = http.post("http://tiku.cfdown.site/insertOrUpdate", {
        "question": question,
        "answer": answer
    });
    if (res.body.json() == 200) {
        console.info("成功");
    }
}

/****************************************************** */
exports.randomNum = randomNum;
exports.challengeQuestionLoop = challengeQuestionLoop;
exports.competitionLoop = competitionLoop;
exports.dailyQuestionLoop = dailyQuestionLoop;
exports.zsyQuestionLoop = zsyQuestionLoop
exports.competitionLoopnew = competitionLoopnew