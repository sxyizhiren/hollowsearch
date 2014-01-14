var pubfun = require('./publicfn');
//////DEBUG 标记
pubfun.openDebug();//放到尽量前面
process.env.FIRSTDUMP = 1;
//////////////

var httpsvr=require('./httpserver');
httpsvr.open();



