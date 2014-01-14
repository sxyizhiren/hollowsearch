/**
 * Created by jin on 14-1-13.
 */

var pubfun = require('./publicfn');
//////DEBUG 标记
pubfun.openDebug();//放到尽量前面
process.env.FIRSTDUMP = 1;
//////////////


var searcher = require('./search');

var iQuery={
  words:'男',
  pagenum:0,
  numperpage:10
};
searcher.query(iQuery,function(err,texts){
  console.log(err);
  console.log(texts);
});



