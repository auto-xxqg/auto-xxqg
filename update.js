console.show();

var tikuCommon = require("./tikuCommon.js");

//检查更新2021.3.6xzy更新

//这个不能放在main中，
//原因:一个APP如果在主线程中请求网络操作，将会抛出Wrapped android.os.NetworkOnMainThreadException。
//Android这个设计是为了防止网络请求时间过长而导致界面假死的情况发生。

var iff = files.read("./project.json");
var vers = JSON.parse(iff);
let getUrl = "https://pro.3141314.xyz/getCode.php?mode=lastBuild";
var r = http.get(getUrl);

if(r.statusCode != 200){ 
    log("请求更新失败: " + r.statusCode + " " + r.statusMessage); 
}else{
var update = r.body.json();
if (update.version != vers.versionName) {
    dialogs.build({ 
        //对话框标题 
        title: "发现新版本", 
        //对话框内容 
        content: "检测到有更新 "+update.version+"\n检测到新版本，请前往https://pro.3141314.xyz 下载新版本！\n版本号："+update.version+"\n更新简介:\n请前往官网https://3141314.xyz查看", 
        //确定键内容 
        positive: "下载", 
        //取消键内容 
        negative: "取消", 
        //中性键内容 
        neutral: "到浏览器下载"
    }).on("positive", ()=>{ 
        //监听确定键 
        toast("开始下载....");
        
        var storage = storages.create("data");
        storage.put("apkName", update.apkName);
        
        engines.execScriptFile("./updateApk.js");
    }).on("neutral", ()=>{ 
        //监听中性键 
        app.openUrl("https://pro.3141314.xyz"); 
    }).show();
}else{
    log("已是最新版本");
}
}

//从网络题库更新 2021.3.29xzy添加
//这里是直接使用的lazystudy的题库
importClass(android.database.sqlite.SQLiteDatabase);
/**
 * @description: 更新数据库tikuNet表
 * @param  {} liArray li列表，包含题目和答案
 */
function CreateAndInsert(liArray){
    var abcdlist = ["A","B","C","D"]
    var dbName = "tiku.db";
    //文件路径
    var path = files.path(dbName);
    //确保文件存在
    if (!files.exists(path)) {
        files.createWithDirs(path);
    }
    //创建或打开数据库
    var db = SQLiteDatabase.openOrCreateDatabase(path, null);
    var createTable = "\
    CREATE TABLE IF NOT EXISTS tiku(\
    question CHAR(253),\
    answer CHAR(100)\
    );";
    var cleanTable = "DELETE FROM tiku";
    db.execSQL(createTable);
    db.execSQL(cleanTable);
    log("创建打开清空表tiku!");

    var sql = "INSERT INTO tiku (question, answer, option) VALUES (?, ?, ?)";
    db.beginTransaction();
    var stmt = db.compileStatement(sql);
    for (var li = 0, len = liArray.length; li < len; li++) {
        //log("题目："+li.text());
        var tiMu = liArray[li][0];
        var daAn = liArray[li][1];
        var oP = liArray[li][3];
        if(tiMu == null) tiMu = '无';
        if(daAn == null) daAn = '无';
        if(oP == null) oP = abcdlist[random(0, 3)];
        log(util.format("题目:%s\n答案:%s\n选项:%s"),tiMu,daAn, oP);
        stmt.bindString(1, tiMu);
        stmt.bindString(2, daAn);
        stmt.bindString(3, oP);
        stmt.executeInsert();
        stmt.clearBindings();
    }
    db.setTransactionSuccessful();
    db.endTransaction();
    db.close();
    return true;
}


/**
 */
function updateTikunet() {
    log("开始更新题库，请先不要进行操作!!!");
    var storage = storages.create("data");
    var onlineTiKuUrl1 = storage.get("onlineTiKuUrl1", "https://tiku.3141314.xyz");
    var onlineTiKuUrl = onlineTiKuUrl1 + "/getAnswer";
    var onlineTiKuUrl2 = onlineTiKuUrl1 + "/tableCount";
    
    var tikuCount = http.get(onlineTiKuUrl2);
    var tableCount = tikuCount.body.json();
    log("本地题目条数："+tikuCommon.allCaseNum("tiku"));
    log("云端题目条数："+tableCount[0][0]);
    if(tableCount[0][0] - tikuCommon.allCaseNum("tiku") >= 10){
        log("开始下载题库");
        var tikuServer = http.get(onlineTiKuUrl);
        if(tikuServer.statusCode != 200){ 
            log("请求题库失败: " + tikuServer.statusCode + " " + tikuServer.statusMessage); 
        }else{
            var liArray = tikuServer.body.json();
            log(util.format("题库下载完毕"));
            //执行更新
            log("开始更新数据库...");
            if (CreateAndInsert(liArray)) {
                log("数据库更新完毕！");
                sleep(3000);
                console.hide();
                return liArray.length;
            } else {
                log("更新失败");
                sleep(3000);
                return -1;
            }
        }
    }else{
        log("题目数量相同或超出或少不到10条，无需更新");
        sleep(3000);
        console.hide();
        return 0;
    }
}

exports = updateTikunet();