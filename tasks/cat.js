"use strict";

module.exports = function(grunt){
    var fs = require("fs");
    var configUrl = "./static/";
    grunt.registerMultiTask('replace', "replace template", function() {
        try{
            var hash_file = grunt.file.read(configUrl + "hash.json");
            var hashMap = JSON.parse(hash_file.toString()) || {};
            var source_file = grunt.file.read("index_publish.html");
            grunt.file.write("index.html", changeToPublish(source_file, hashMap));
            grunt.file.recurse(configUrl, function(abspath, rootdir, subdir, filename){
                var prefix;
                var lastfix;
                var arr = [];
                var index = filename.indexOf(".js") > 0 ? filename.indexOf(".js") : filename.indexOf(".css");
                if(index){
                    prefix = filename.slice(0, index);
                    arr = prefix.split('_');
                    if(arr.length > 1 && isDeleteFile(arr[1], hashMap)){
                        console.log(filename);
                        grunt.file.delete(configUrl + filename);
                    }
                }
                //console.log(arguments);
            });
        }catch(e){
            reject("replace出错！");
        }
    });

    function isDeleteFile(target, map){
        var f = true;
        for(var i in map){
            if(target == map[i]){
                f = false;
            }
        }
        return f;
    }

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