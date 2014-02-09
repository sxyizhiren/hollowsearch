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
    if(!err){
      //文本太长就截断，但是不能改变texts原有的text内容，这个内容直接指向cache。所以新建一个数组
      var cpTexts=[];
      for(var i= 0,len=texts.length;i<len;i++){
        var node=texts[i];
        cpTexts[i]={};
        cpTexts[i].id=node.id;
        cpTexts[i].view=node.view;//没用到
        cpTexts[i].pubtime=node.pubtime;
        cpTexts[i].sex=node.sex;
        cpTexts[i].key=node.key;
        cpTexts[i].leftlen=0;
        if(node.text.length > 350){
          cpTexts[i].leftlen = node.text.length - 300;
          cpTexts[i].text = node.text.substr(0,300);
        }else{
          cpTexts[i].leftlen = 0;
          cpTexts[i].text=node.text;
        }
      }
      var ret = {err:err,res:cpTexts};
      console.log(cpTexts);
      res.send(ret);//json形式，供ajax调用

    }else{
      var ret = {err:err};
      res.send(ret);//json形式，供ajax调用
    }
  });

};