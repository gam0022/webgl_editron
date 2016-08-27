// modules
var fs = require('fs');
var remote = require('electron').remote;
var dialog = remote.dialog;

// variables
var editors = [];
var editorNames = ['Javascript', 'HTML', 'Vertex', 'Fragment', 'VertexPost', 'FragmentPost'];
var editorModes = ['javascript', 'html', 'glsl', 'glsl', 'glsl', 'glsl'];
var editorTheme = ['monokai', 'monokai', 'vibrant_ink', 'vibrant_ink', 'vibrant_ink', 'vibrant_ink'];
var sourceArray = [];
var popupTime = 0;

// const var
var TARGET_FILE_NAME = [
    'html.html',
    'javascript.js',
    'vs.vert',
    'vsp.vert',
    'fs.frag',
    'fsp.frag'
];

// initial
window.onload = function(){
    var e, s, t;
    editorInitialize();
    win = window;
    win.addEventListener('keydown', keydown, false);
    for(var i = 0, l = editorNames.length; i < l; i++){
        bid('tab' + editorNames[i]).addEventListener('click', tabSelecter, false);
    }
    win.addEventListener('click', function(eve){showPopup(false);}, false);
    e = bid('iconMenu');
    e.addEventListener('click', function(eve){showPopup(true);}, false);
    e = bid('iconList');
    e.addEventListener('click', loadDirectory, false);

    run = false;

};

function addTempleteList(list){
    var i, j, e, f, a;
    e = bid('hidden');
    a = e.childNodes;
    for(i = 0, j = a.length; i < j; ++i){
        if(a[i].nodeType === 1 && a[i].id !== 'hiddenDefault'){
            e.removeChild(a);
            a[i] = null;
        }
    }
    f = bid('hiddenDefault')
    if(!list || !list.hasOwnProperty('length') || list.length === 0){
        f.style.display = 'block';
        return;
    }else{
        f.style.display = 'none';
    }
    for(i = 0, j = list.length; i < j; ++i){
        f = document.createElement('div');
        f.className = 'list';
        f.textContent = zeroPadding(i, 3);
        e.appendChild(f);
    }
}

function loadDirectory(){
    var i, j, list, projectRoot, separator;
    var currentWindow = remote.getCurrentWindow();
    remote.dialog.showOpenDialog(currentWindow, {
        defaultPath: remote.app.getAppPath('exe'),
        properties: ['openDirectory']
    }, function(dir){
        if(dir){
            // directory check
            fs.readdir(dir[0], function(err, files){
                if(err || !files || !files.hasOwnProperty('length') || files.length === 0){
                    console.warn('error: readdire');
                    return
                }
                separator = process.platform === 'darwin' ? '/' : '\\';
                projectRoot = dir[0] + separator;
                list = [];
                files.filter(function(file){
                    return fs.existsSync(projectRoot + file) && fs.statSync(projectRoot + file).isDirectory();
                }).forEach(function(file){
                    list.push({
                        index: parseInt(file, 10),
                        indexString: file,
                        targetDirectory: projectRoot + file
                    });
                });

                // map for templete/
                sourceArray = [];
                loadFileList(list, function(res){
                    console.log(res);
                    addTempleteList(res);
                    showPopup(true);
                });
            });
        }
    });
}

function loadFileList(list, callback){
    var i, j;
    var separator, projectRoot;
    if(!list){return;}
    for(i = 0, j = list.length; i < j; ++i){
        // map for templete/i
        fs.readdir(list[i].targetDirectory, (function(item){return function(err, files){
            if(err || !files || !files.hasOwnProperty('length') || files.length === 0){
                console.warn('error: readfiles');
                return;
            }
            separator = process.platform === 'darwin' ? '/' : '\\';
            projectRoot = item.targetDirectory + separator;
            files.filter(function(file){
                return (
                    fs.existsSync(projectRoot + file) &&
                    fs.statSync(projectRoot + file).isFile() &&
                    fileNameMatch(file)
                );
            }).forEach(function(file){
                var fileData = {
                    index: item.index - 1,
                    fileName: file,
                    path: item.targetDirectory,
                };
                readFile(projectRoot + file, (function(data){return function(source){
                    var i, j, k, l, f = true;
                    if(source){
                        if(!sourceArray[data.index]){sourceArray[data.index] = {path: data.path};}
                        sourceArray[data.index][data.fileName] = source;
                        if(sourceArray.length === list.length){
                            for(i = 0, j = list.length; i < j; ++i){
                                f = f && sourceArray[i] && Object.keys(sourceArray[i]).length === (TARGET_FILE_NAME.length + 1);
                            }
                            if(f){callback(sourceArray);}
                        }
                    }
                };})(fileData));
            });
        };})(list[i]));
    }
}

function fileNameMatch(name){
    var i, f = false;
    for(i = 0; i < TARGET_FILE_NAME.length; ++i){
        f = f || (TARGET_FILE_NAME[i] === name);
    }
    return f;
}

function readFile(path, callback){
    fs.readFile(path, function(err, source){
        if(err){
            console.warn('error : ' + err);
            return;
        }
        callback(source.toString());
    });
}

function writeFile(path, data){
    fs.writeFile(path, data, function(err){
        if(err){
            console.warn('error : ' + err);
            return;
        }
    });
}

function showPopup(flg){
    var f, e = bid('hidden');
    if(flg === undefined || flg === null){
        f = e.style.display !== 'block';
        if(f){
            e.style.display = 'block';
            popupTime = Date.now();
        }else{
            if(Date.now() - popupTime > 100){
                e.style.display = 'none';
            }
        }
    }
    if(flg){
        e.style.display = 'block';
        popupTime = Date.now();
    }else{
        if(Date.now() - popupTime > 100){
            e.style.display = 'none';
        }
    }
}

function editorInitialize(){
    for(var i = 0, l = editorNames.length; i < l; i++){
        editors[i] = editorGenerate('editor' + editorNames[i], editorModes[i], editorTheme[i]);
    }
}

function editorGenerate(id, mode, theme){
    var elm;
    elm = ace.edit(id);
    elm.setTheme("ace/theme/" + theme);
    elm.getSession().setMode("ace/mode/" + mode);
    elm.getSession().setUseSoftTabs(false);
    bid(id).style.fontSize = '14px';
    return elm;
}

function editorAddSource(sourceList){
    // var i, j;
    // for(i = 0, j = sourceList.length; i < j; ++i){
    //     if
    // }
    // switch(ajaxTarget){
    //     case s + 'templete/':
    //         try{
    //             t = JSON.parse(r);
    //         }catch(err){
    //             return;
    //         }
    //         if(t != null){
    //             if(t['javascript'] != null && t['html'] != null && t['vs'] != null && t['fs'] != null){
    //                 editors[0].setValue(t['javascript']);
    //                 editors[1].setValue(t['html']);
    //                 editors[2].setValue(t['vs']);
    //                 editors[3].setValue(t['fs']);
    //                 editors[4].setValue(t['vsp']);
    //                 editors[5].setValue(t['fsp']);
    //                 editors[1].gotoLine(1);
    //                 editors[2].gotoLine(1);
    //                 editors[3].gotoLine(1);
    //                 editors[4].gotoLine(1);
    //                 editors[5].gotoLine(1);
    //                 setTimeout(function(){editors[0].gotoLine(1);}, 100);
    //             }
    //         }
    //         break;
    // }
    // e = bid('loadButton');
    // e.addEventListener('click', editorLoadTemplete, false);
    // e = bid('runButton');
    // e.addEventListener('click', init, false);
}

function editorFontSize(upper){
    for(var i = 0, l = editorNames.length; i < l; i++){
        var e = bid('editor' + editorNames[i]);
        var size = e.style.fontSize.match(/\d+/);
        if(size != null){
            if(upper){
                e.style.fontSize = Math.max(parseInt(size[0]) + 2, 8) + 'px';
            }else{
                e.style.fontSize = Math.max(parseInt(size[0]) - 2, 8) + 'px';
            }
        }
    }
}

function init(){
    var b, d, e, f;
    var s, t;
    e = bid('frame');
    try{e.contentWindow.WE.run = false;}catch(err){}
    f = e.parentNode;
    f.removeChild(e);
    e = null;
    e = document.createElement('iframe');
    e.id = 'frame';
    f.insertBefore(e, f.firstChild);
    d = e.contentDocument;
    d.open();
    d.write(editors[1].getValue());
    d.close();
    b = d.body;
    s =  'var WE = {parent: window.parent, console: null, button: null, run: false, err: null, vs: "", fs: "", vsp: "", fsp: ""};\n';
    s += 'function initialize(){\n';
    s += '  WE.vs = "' + editors[2].getValue().replace(/\n/g, '\\n') + '";\n';
    s += '  WE.fs = "' + editors[3].getValue().replace(/\n/g, '\\n') + '";\n';
    s += '  WE.vsp = "' + editors[4].getValue().replace(/\n/g, '\\n') + '";\n';
    s += '  WE.fsp = "' + editors[5].getValue().replace(/\n/g, '\\n') + '";\n';
    s += '  WE.run = false;\n';
    s += '  WE.console = WE.parent.document.getElementById("console");\n';
    s += '  WE.button = WE.parent.document.getElementById("stopButton");\n';
    s += '  WE.button.addEventListener("click", function(){WE.run = false;}, false);\n';
    s += '  window.onerror = function(msg, url, line){\n';
    s += '    var e = WE.parent.document.createElement("p");\n';
    s += '    var f = WE.parent.document.createElement("strong");\n';
    s += '    f.textContent = msg + "; line " + Math.max(line - 32, 0);\n';
    s += '    e.appendChild(f);\n';
    s += '    WE.console.insertBefore(e, WE.console.firstChild);\n';
    s += '    WE.err = msg;\n';
    s += '    return true;\n';
    s += '  };\n';
    s += '  window.console.log = function(msg){\n';
    s += '    var e = WE.parent.document.createElement("p");\n';
    s += '    var f = WE.parent.document.createElement("em");\n';
    s += '    if(typeof msg === "number"){\n';
    s += '      f.textContent = "log: " + msg;\n';
    s += '    }else if(msg instanceof Array){;\n';
    s += '      f.textContent = "log: " + "[" + msg.join(\', \') + "]";\n';
    s += '    }else{;\n';
    s += '        f.textContent = "log: \'" + msg + "\'";\n';
    s += '    };\n';
    s += '    e.appendChild(f);\n';
    s += '    WE.console.insertBefore(e, WE.console.firstChild);\n';
    s += '  };\n';
    s += editors[0].getValue() + '}';
    s += 'var scr = document.createElement("script");\n';
    s += 'scr.onload = function(){initialize();}\n';
    s += 'scr.src = "glcubic.js"\n';
    s += 'document.body.appendChild(scr);\n';
    t = d.createElement('script');
    t.textContent = s;
    b.appendChild(t);
    if(e.contentWindow.WE != null){
        if(e.contentWindow.WE.err === null){
            e = bid('console');
            f = document.createElement('p');
            d = new Date();
            f.textContent = 'reload [' + zeroPadding(d.getHours(), 2) + ':' + zeroPadding(d.getMinutes(), 2) + ']';
            e.insertBefore(f, e.firstChild);
        }
    }else{
        e = document.createElement('p');
        f = document.createElement('strong');
        f.textContent = 'editor -> javascript syntax error';
        e.appendChild(f);
        f = bid('console');
        f.insertBefore(e, f.firstChild);
    }
}

function tabSelecter(eve){
    var c, d, e, t;
    e = eve.currentTarget;
    if(e.className.match(/active/)){return;}
    t = e.id.replace('tab', '');
    for(var i = 0, l = editorNames.length; i < l; i++){
        if(t === editorNames[i]){
            c = 'editor selected';
            d = 'tab active';
        }else{
            c = 'editor';
            d = 'tab';
        }
        bid('editor' + editorNames[i]).className = c;
        bid('tab' + editorNames[i]).className = d;
    }
    editorInitialize();
}

function keydown(eve){
    if(eve != null){
        if(eve.ctrlKey || eve.metaKey){
            switch(eve.keyCode){
                case 83:
                    eve.returnValue = false;
                    setTimeout(init, 100);
                    return false;
                    break;
            }
        }else if(eve.altKey){
            switch(eve.keyCode){
                case 188:
                    editorFontSize(false);
                    break;
                case 190:
                    editorFontSize(true);
                    break;
            }
        }else{
            try{
                bid('frame').contentWindow.WE.run = (eve.keyCode !== 27);
            }catch(err){}
        }
    }
}

function bid(id){return document.getElementById(id);}

function zeroPadding(num, count){
    var z = (new Array(count)).join('0');
    if((num + '').length > count){return num + '';}
    return (z + num).slice(-1 * count);
}

function dirPath(){
    var a = location.href.split('/');
    a.pop();
    return a.join('/') + '/';
}

