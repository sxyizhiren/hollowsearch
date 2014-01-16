var pubfunc=require('./publicfn');
pubfunc.closeDebug();

//启动抓取
var GoodGuy = require('./collector/guy').GoodGuy;
var goodguy = new GoodGuy();
goodguy.collect();

//启动httpserver
var httpsvr=require('./httpserver');
httpsvr.open();


