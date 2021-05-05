console.show();

//检查更新2021.3.6xzy更新
log("检查更新...");
//这个不能放在main中，
//原因:一个APP如果在主线程中请求网络操作，将会抛出Wrapped android.os.NetworkOnMainThreadException。
//Android这个设计是为了防止网络请求时间过长而导致界面假死的情况发生。
var r = http.get("http://xzy.9gz.xyz/web/xxqg/v.html");
//log(r);
if(r.statusCode != 200){ 
    log("请求更新失败: " + r.statusCode + " " + r.statusMessage); 
}else{
var update = r.body.json();
if (update.v != "v2.5.1") {
    alert("检测到有更新 "+update.v, "检测到新版本，请前往http://xzy.9gz.xyz/web/xxqg/下载新版本！\n版本号："+update.v+"\n更新简介:\n"+update.mes);
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
    CREATE TABLE IF NOT EXISTS tikuNet(\
    question CHAR(253),\
    answer CHAR(100)\
    );";
    var cleanTable = "DELETE FROM tikuNet";
    db.execSQL(createTable);
    db.execSQL(cleanTable);
    log("创建打开清空表tikuNet!");

    var sql = "INSERT INTO tikuNet (question, answer) VALUES (?, ?)";
    db.beginTransaction();
    var stmt = db.compileStatement(sql);
    for (var li = 0, len = liArray.length; li < len; li++) {
        //log("题目："+li.text());
        var tiMu = liArray[li].content;
        var daAn = liArray[li].answer;
        log(util.format("题目:%s\n答案:%s"),tiMu,daAn);
        stmt.bindString(1, tiMu);
        stmt.bindString(2, daAn);
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
    log("开始下载题库json数据...");
    var htmlArray = http.get("https://cdn.jsdelivr.net/gh/lolisaikou/tiku-autoupdate/questions.json");
    var liArray = htmlArray.body.json();
    log(util.format("题库下载完毕，题目总数:%s"), liArray.length);
    var iff = files.read("./if.txt");
    if (iff != liArray.length){
    files.write("./if.txt", liArray.length);
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
    }else{
        log("题目数量相同，无需更新");
        sleep(3000);
        console.hide();
        return 0;
    }
}
//updateTikunet();
exports = updateTikunet();