var searcher = require('../../search');
var pubfunc = require('../../publicfn');

exports.query = function(req, res){
  var params = req.params;console.log(params);

  var iQuery={
    words:pubfunc.fixSearchString(params.query),//引号替换，长度限制
    page:pubfunc.fixSearchPage(params.page),
    per:pubfunc.fixSearchPer(params.per)
  };

  //console.log(iQuery);
  searcher.query(iQuery,function(err,texts){
    var ret = {err:err,res:texts};
    res.send(ret);//json形式，供ajax调用
    //res.render('listSecret', { title: '搜索结果' ,texts:texts ,iQuery:iQuery});
  });

};