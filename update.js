//检查更新2021.3.6xzy更新
//这个不能放在main中，
//原因:一个APP如果在主线程中请求网络操作，将会抛出Wrapped android.os.NetworkOnMainThreadException。
//Android这个设计是为了防止网络请求时间过长而导致界面假死的情况发生。
var r = http.get("http://xzy.9gz.xyz/web/xxqg/v.html");
//log(r);
var update = r.body.json();
if (update.v != "v2.5.0") {
    alert("检测到有更新", "检测到新版本，请前往http://xzy.9gz.xyz/web/xxqg/下载新版本！");
}