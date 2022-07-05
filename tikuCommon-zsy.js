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
 * @description: 从数据库中搜索答案
 * @param: question 问题
 * @return: answer 答案
 */
function getAnswer(question, table_name) {
    var dbName = "tiku.db";
    var path = files.path(dbName);
    var db = SQLiteDatabase.openOrCreateDatabase(path, null);
    if (tikuCustom = '0') {
        sql = "SELECT answer, option FROM " + table_name + " WHERE question LIKE '" + question + "%'"
        var cursor = db.rawQuery(sql, null);
        var answer = new Array;
        if (cursor.moveToFirst()) {
            answer.push(cursor.getString(0));
            answer.push(cursor.getString(1));
            // toastLog(answer);
            cursor.close();
            db.close();
            return answer;
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
            sql = "SELECT answer,option,question FROM " + table_name + " WHERE id=" + sum + ";";
            //log(sql);
            var answer = new Array;
            var cursor = db.rawQuery(sql, null);
            if (cursor.moveToFirst()) {
                answer.push(cursor.getString(0));
                answer.push(cursor.getString(1));
                answer.push(cursor.getString(2));
                // toastLog(answer);
                cursor.close();
                // db.close();
                //log(answer[1]);
                var similarPercent = similar(question, answer[2])
                log(similarPercent);
                if (similarPercent > tikuPercent) {
                    return answer;
                }
            }
            sum--;
        }
        return ' ';
    }
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

exports.getAnswer = getAnswer;