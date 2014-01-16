//share buttons
function createsharenode(url,title,pic,desc){var div=$('<div id="bdshare" class="gridInner bdshare_t bds_tools_24 get-codes-bdshare"></div>');div.attr('data',JSON.stringify({'text':title,'title':title,'pic':pic,'url':url,'desc':desc}));$('<a class="bds_tsina"></a>').appendTo(div);$('<a class="bds_tqq"></a>').appendTo(div);$('<a class="bds_qzone"></a>').appendTo(div);$('<a class="bds_douban"></a>').appendTo(div);$('<a class="bds_renren"></a>').appendTo(div);$('<span class="bds_more">更多</span>').appendTo(div);return div;}
/*$('<a class="shareCount"></a>').appendTo(div);*/

function creategrid(lists){
  for(var i= 0,len=lists.length;i<len;i++){
    var node=lists[i];
    if($('#'+node.key).length>0){
      //已经存在该id的内容了,不回重复加载
      continue;
    }
    var jQgrid=$('<div class="grid"></div>');
    jQgrid.attr('id',node.key);
    var jQtext=$('<div class="text"></div>');
    jQtext.text(node.text);
    jQtext.appendTo(jQgrid);

    var jQtagdiv=$('<div class="tag gridInner"></div>');
    var jQtag=$('<span class="margin5 label label-info"></span>');
    jQtag.text(node.pubtime);
    jQtag.appendTo(jQtagdiv);
    jQtag=$('<span class="margin5 label label-info"></span>');
    jQtag.text(sexSwitcher[node.sex]);
    jQtag.appendTo(jQtagdiv);
    jQtagdiv.appendTo(jQgrid);

    var jQshare=createsharenode(siteurl+'/detail/'+node.key,'客官来这里|你室友知道吗',siteurl+'/images/logo.png',node.text.substr(0,100)+'[客官不可以]'/*太长分享时会出错*/);
    jQshare.appendTo(jQgrid);
    jQgrid.appendTo($('#container'));
  }
}
//re waterfall
function relist(){$("#container").BlocksIt('reload');var winWidth=$(window).width();var conWidth;if(winWidth<770){col=2}else if(winWidth<1100){col=3}else if(winWidth<1400){col=4;}else{col=5;}conWidth=col * eachcolWidth;if(conWidth!=currentWidth){currentWidth=conWidth;$('#container').width(conWidth);$('#container').BlocksIt({numOfCol:col,offsetX:8,offsetY:8});}};
function initAnimate(){$('#header').css({'top':-50}).delay(1000).animate({'top':0},800);$('#footer').css({'bottom':-15}).delay(1000).animate({'bottom':0},800);}
function initdetail(){$("#container").html('');creategrid([iquery.detail]);relist();$('#loading').text('');}
//load new
function loadquery(){
  var xhrurl='/search/'+iquery.words+'/page/'+iquery.page+'/per/'+iquery.per;console.log(xhrurl);
  if(isLoading){console.log('already loading!');return;}else{isLoading=true;$('#loading').text('正在努力加载...');}
  $.ajax({url:xhrurl,dataType:"json",success:function(data){if(data.err){alert(data.err);}else if(data.res.length==0){$('#loading').text('没新的了，我先休息一下...');setTimeout(loadquery,10*1000);}else{creategrid(data.res);relist();iquery.page++;}
    isLoading=false;},error:function(){alert('出错了');isLoading=false;}});}
//scroll to top
function toTop(){/*$('body,html')？为什么*/$('html').animate({scrollTop:0},1000);}
//load specified words
function querywords(words){iquery.words=words;iquery.page=0;$("#container").html('');loadquery();}
//on search button clicked
function searchwords(){if($('#searchwrods').val().trim()==''){$('#searchwrods').attr('placeholder','客官还没点呢');return;}querywords($('#searchwrods').val());}
//on scroll especially bottom
function onscroll(){if($(document).scrollTop()+$(window).height() + 10/*提早n个像素触发*/ >= $(document).height()){console.log('loading...');loadquery();/*$("#container").BlocksIt('reload');*/}}