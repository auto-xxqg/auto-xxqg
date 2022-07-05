console.show();

var storage = storages.create("data");
var apkName = storage.get("apkName");
log(apkName);
var app下载地址 = "https://pro.3141314.xyz/build/"+apkName;

let url = app下载地址; // update_list.url
var filePath = "/sdcard/autoStudyPro/base.apk";
log('url=' + url);
log('filePath=' + filePath);
download(url, filePath);

function download(url, filePath) {
  importClass('java.io.FileOutputStream');
  importClass('java.io.IOException');
  importClass('java.io.InputStream');
  importClass('java.net.MalformedURLException');
  importClass('java.net.URL');
  importClass('java.net.URLConnection');
  importClass('java.util.ArrayList');

  var url = new URL(url);
  var conn = url.openConnection(); //URLConnection
  var inStream = conn.getInputStream(); //InputStream
  var fs = new FileOutputStream(filePath); //FileOutputStream
  var connLength = conn.getContentLength(); //int
  var buffer = util.java.array('byte', 1024); //byte[]
  var byteSum = 0; //总共读取的文件大小
  var byteRead; //每次读取的byte数
  log('要下载的文件大小=');
  log(connLength);
  var threadId = threads.start(function() {
    var w = floaty.rawWindow(
      <vertical gravity="center" w="*" h="auto">
        <horizontal layout_gravity="center" gravity="center">
          <text textSize="39sp">下载进度</text>
          <text textSize="39sp" id="progressNum">
            0
          </text>
        </horizontal>
      </vertical>
    );
    while (1) {
      var 当前写入的文件大小 = byteSum;
      var progress = (当前写入的文件大小 / connLength) * 100;
      if (progress > 0.1) {
        var progress = parseInt(progress).toString() + '%';
        ui.run(function() {
          w.progressNum.setText(progress);
        });
        toastLog("进度："+progress);
        if (当前写入的文件大小 >= connLength) {
          break;
        }
      }
      sleep(1000);
    }
  });
  while ((byteRead = inStream.read(buffer)) != -1) {
    byteSum += byteRead;
    //当前时间
    currentTime = java.lang.System.currentTimeMillis();
    fs.write(buffer, 0, byteRead); //读取
  }
  threadId && threadId.isAlive() && threadId.interrupt();
  toastLog('下载完成');
   path = "/sdcard/autoStudyPro/base.apk"
    app.startActivity({
      data: "file://" + path,
      type: "application/vnd.android.package-archive",
      action: "VIEW",
      flags: ["grant_read_uri_permission", "grant_write_uri_permission"]
    })
    sleep(3000);
    console.hide();
}
