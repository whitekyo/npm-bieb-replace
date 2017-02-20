"use strict";

module.exports = function(grunt){
    var fs = require("fs");
    var configUrl = "static/";
    

    grunt.registerMultiTask('cat_replace', "replace template", function() {
        var promise = new Promise(function(resolve, reject){
    fs.readFile(configUrl + "hash.json", function(err, data){
            if(err){
                reject("读取配置文件失败！");
            }else{
                try{
                    var json_map = JSON.parse(data.toString() || {});
                    resolve(json_map)
                }catch(e){
                    reject("配置文件格式错误！");
                }
            }
        });
    });

    promise.then(function(config){
        var readHtmlPromise = new Promise(function(resolve, reject){
            fs.readFile("index_publish.html", function(err, data){
                if(err){
                    reject("读取主页面失败！");
                }else{
                    var htmlStr = data.toString();
                    resolve(changeToPublish(htmlStr, config));
                }
            });
        });
        readHtmlPromise.then(function(data){
            fs.writeFile("index.html", data, function(){
                console.log("写入成功");
            });
        }, function(errMsg){
            console.log(errMsg);
        });

      }, function(errMsg){
          console.log(errMsg);
      });
    });

    function changeToPublish(htmlTemplate, config){
        for(var k in config){
            var v = config[k];
            var l = k.split('.');
            var postfix = l.pop();
            var z = l.pop();
            l.push(z + '_' + v);
            l.push(postfix);
            try{
                if(l[l.length - 1] == "js"){
                    /* 替换js */
                    htmlTemplate = htmlTemplate.replace(/data-main="(.*?)"/, "data-main=\"" + configUrl + l.join('.') + "\"");
                }else if(l[l.length - 1] == "css"){
                    /* 替换css */
                    var cssPageUrl = configUrl + l.join('.');
                    var comboLink = "\t<link type=\"text/css\" rel=\"stylesheet\" href=\"" + cssPageUrl + "\" \/>\n";

                    htmlTemplate = htmlTemplate.replace(/<link.*?>/g, function($1){
                        ;
                        return "<!--" + $1 + "-->";
                    });
                    htmlTemplate = htmlTemplate.replace(/<\/head>/, function($1){
                        return comboLink + $1;
                    });

                    /* 待优化完善 */
                    fs.readFile(cssPageUrl, function(err, data){
                        if(err){
                            console.log("读取合并后css文件失败!");
                        }else{
                            var cssText = data.toString();
                            cssText = cssText.replace(/(background|background-image):url\(([^.].*?)\)/g, function($1, $2, $3){
                                return $2 + ":url(../image/" + $3 + ')';
                            });

                            fs.writeFile(cssPageUrl, cssText, function(){
                                console.log("写入合并后css文件成功");
                            });
                        }
                    });

                }
            }catch(e){
                console.log(e);
            }

        }
        return htmlTemplate;
    }

};








