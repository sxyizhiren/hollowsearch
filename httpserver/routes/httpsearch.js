var searcher = require('../../search');

exports.query = function(req, res){
  var params = req.params;console.log(params);
  var words = params.query;
  var page = params.page; if(page < 0){page = 0;} //0表示第一页
  var per = params.per; if(per < 0){per = 0;} //将采用默认值

  var iQuery={
    words:words,
    pagenum:page,
    numperpage:per
  };
  //res.send(iQuery);
  searcher.query(iQuery,function(err,texts){
    res.render('listSecret', { title: '搜索结果' ,texts:texts});
  });

};