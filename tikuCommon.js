importClass(android.database.sqlite.SQLiteDatabase);

var storage = storages.create("data");
var tikuCustom = storage.get('tikuCustom', 0);
var tikuPercent = storage.get('tikuPercent', 0.1);

function similar(s, t, f) {
    if (!s || !t) {
        return 0
    }
    var l = s.length > t.length ? s.length : t.length
    var n = s.length
    var m = t.length
    var d = []
    f = f || 3
    var min = function(a, b, c) {
        return a < b ? (a < c ? a : c) : (b < c ? b : c)
    }
    var i, j, si, tj, cost
    if (n === 0) return m
    if (m === 0) return n
    for (i = 0; i <= n; i++) {
        d[i] = []
        d[i][0] = i
    }
    for (j = 0; j <= m; j++) {
        d[0][j] = j
    }
    for (i = 1; i <= n; i++) {
        si = s.charAt(i - 1)
        for (j = 1; j <= m; j++) {
            tj = t.charAt(j - 1)
            if (si === tj) {
                cost = 0
            } else {
                cost = 1
            }
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
        }
    }
    let res = (1 - d[n][m] / l)
    return res.toFixed(f)
}

/**
 * @description: 判断题库是否存在
 * @param: null
 * @return: boolean
 */
function judge_tiku_existence() {
    var dbName = "tiku.db";
    var path = files.path(dbName);
    if (!files.exists(path)) {
        //files.createWithDirs(path);
        console.error("未找到题库！请将题库文件放置与js文件同一目录下再运行！");
        return false;
    }
    var db = SQLiteDatabase.openOrCreateDatabase(path, null);
    var createTable = "\
    CREATE TABLE IF NOT EXISTS tiku(\
    question CHAR(253),\
    option CHAR(10),\
    answer CHAR(100),\
    wrongAnswer CHAR(100)\
    );";
    db.execSQL(createTable);
    db.close();
    return true;
}

/**
 * @description: 返回数据库列名
 * @param: columnName
 * @return: boolean
 */
function judge_tiku_columnName_existence(columnName) {
    var dbName = "tiku.db";
    var path = files.path(dbName);
    if (!files.exists(path)) {
        //files.createWithDirs(path);
        console.error("未找到题库！请将题库文件放置与js文件同一目录下再运行！");
        return false;
    }
    var db = SQLiteDatabase.openOrCreateDatabase(path, null);
    /* cursor.execute("PRAGMA table_info(t1)")
    name = cursor.fetchall()
    print name
    # [(0, u'f1', u'integer', 0, None, 0)]
    cursor.execute("SELECT sql FROM sqlite_master WHERE tbl_name = 't1' and type = 'table'")
    name = cursor.fetchall()
    print name
    # [(u'CREATE TABLE t1(f1 integer)',)] */
    // cursor.execute("SELECT * FROM tiku");
    let sql = "SELECT count(*) from sqlite_master where name = 'tiku' and sql like '%" + columnName + "%'";
    toastLog
    let cursor = db.rawQuery(sql, null);
    cursor.moveToFirst();
    var count = cursor.getLong(0);
    // toastLog(count); 
    var isFind = false;
    if (count > 0) {
        isFind = true;
    }
    cursor.close();
    db.close();
    return isFind;
}

/**
 * @description: 从数据库中搜索答案
 * @param: question 问题
 * @return: answer 答案
 */
function getAnswer(question, table_name) {
    var dbName = "tiku.db";
    var path = files.path(dbName);
    var db = SQLiteDatabase.openOrCreateDatabase(path, null);
    if (tikuCustom = '0') {
        sql = "SELECT answer,option FROM " + table_name + " WHERE question LIKE '" + question + "%'"
        var cursor = db.rawQuery(sql, null);
        var answer = new Array;
        if (cursor.moveToFirst()) {
            answer.push(cursor.getString(0));
            answer.push(cursor.getString(1));
            // toastLog(answer);
            cursor.close();
            db.close();
            return answer[0];
        } else {
            console.error("题库'" + table_name + "'中未找到答案");
            cursor.close();
            db.close();
            return '';
        }
    } else {
        var sum = allCaseNum('tiku');
        while (sum >= 0) {
            log(sum);
            sql = "SELECT answer,question FROM " + table_name + " WHERE id=" + sum + ";";
            //log(sql);
            var answer = new Array;
            var cursor = db.rawQuery(sql, null);
            if (cursor.moveToFirst()) {
                answer.push(cursor.getString(0));
                answer.push(cursor.getString(1));
                // toastLog(answer);
                cursor.close();
                // db.close();
                //log(answer[1]);
                var similarPercent = similar(question, answer[1])
                log(similarPercent);
                if (similarPercent > tikuPercent) {
                    return answer[0];
                }
            }
            sum--;
        }
        return ' ';
    }
}

/**
 * @description: 增加或更新数据库
 * @param: sql
 * @return: null
 */
function insertOrUpdate(sql) {
    try {
        var dbName = "tiku.db";
        var path = files.path(dbName);
        if (!files.exists(path)) {
            //files.createWithDirs(path);
            console.error("未找到题库!请将题库放置与js同一目录下");
        }
        var db = SQLiteDatabase.openOrCreateDatabase(path, null);
        // toastLog(sql);
        db.execSQL(sql);
        // db.commit();
        db.close();
    } catch (e) {
        return;
    }

}

function searchTiku(keyw) {
    //表名
    var tableName = "tiku";
    var ansArray = searchDb(keyw, tableName, "");
    return ansArray;

}

function searchDb(keyw, _tableName, queryStr) {
    var tableName = _tableName;
    //数据文件名
    var dbName = "tiku.db";
    var path = files.path(dbName);
    //确保文件存在
    if (!files.exists(path)) {
        files.createWithDirs(path);
    }
    //创建或打开数据库
    var db = SQLiteDatabase.openOrCreateDatabase(path, null);
    var query = "";
    if (queryStr == "") {
        query = "SELECT question,answer FROM " + tableName + " WHERE question LIKE '" + keyw + "%'"; //前缀匹配
    } else {
        query = queryStr;
    }

    log(query);
    //query="select * from tiku"
    //db.execSQL(query);

    var cursor = db.rawQuery(query, null);
    cursor.moveToFirst();
    var ansTiku = [];
    if (cursor.getCount() > 0) {
        do {
            var timuObj = {
                "question": cursor.getString(0),
                "answer": cursor.getString(1)
            };
            ansTiku.push(timuObj);
        } while (cursor.moveToNext());
    } else {
        log("题库中未找到: " + keyw);
    }
    cursor.close();
    db.close();
    return ansTiku;

}

function countDb(keyw, _tableName, queryStr) {
    var tableName = _tableName;
    //数据文件名
    var dbName = "tiku.db";
    var path = files.path(dbName);
    //确保文件存在
    if (!files.exists(path)) {
        files.createWithDirs(path);
    }
    //创建或打开数据库
    var db = SQLiteDatabase.openOrCreateDatabase(path, null);
    var query = "";
    if (queryStr == "") {
        query = "SELECT question,answer FROM " + tableName + " WHERE question LIKE '" + keyw + "%'"; //前缀匹配
    } else {
        query = queryStr;
    }

    // log(query);
    query = "select * from tiku";
    //db.execSQL(query);

    var cursor = db.rawQuery(query, null);
    cursor.moveToFirst();
    let count = cursor.getLong(0);
    /* var ansTiku = [];
    if (cursor.getCount() > 0) {
        do {
            var timuObj={"question" : cursor.getString(0),"answer":cursor.getString(1)};
            ansTiku.push(timuObj);
        } while (cursor.moveToNext());
    } else {
        log("题库中未找到: " + keyw);
    } */
    cursor.close();
    db.close();
    // return ansTiku.length;
    return count;
}

/**
 * 查询数据库中的总条数.
 * @return count
 */
function allCaseNum(tableName) {
    var dbName = "tiku.db";
    var path = files.path(dbName);
    if (!files.exists(path)) {
        files.createWithDirs(path);
    }
    let count = 0;
    if (judge_tiku_existence()) {
        let db = SQLiteDatabase.openOrCreateDatabase(path, null);
        let sql = "select count(*) from " + tableName;
        let cursor = db.rawQuery(sql, null);
        cursor.moveToFirst();
        count = cursor.getLong(0);
        cursor.close();
        db.close();
    }
    return count;
}

function executeSQL(sqlstr) {
    //数据文件名
    var dbName = "tiku.db";
    var path = files.path(dbName);
    //确保文件存在
    if (!files.exists(path)) {
        files.createWithDirs(path);
    }
    //创建或打开数据库
    var db = SQLiteDatabase.openOrCreateDatabase(path, null);
    db.execSQL(sqlstr);
    toastLog(sqlstr);
    db.close();
}

function searchNet(keyw) {
    var tableName = "tikuNet";
    var ansArray = searchDb(keyw, tableName, "");
    return ansArray;
}

exports.judge_tiku_existence = judge_tiku_existence;
exports.judge_tiku_columnName_existence = judge_tiku_columnName_existence;
exports.getAnswer = getAnswer;
exports.insertOrUpdate = insertOrUpdate;
exports.searchTiku = searchTiku;
exports.searchNet = searchNet;
exports.searchDb = searchDb;
exports.countDb = countDb;
exports.allCaseNum = allCaseNum;
exports.executeSQL = executeSQL;