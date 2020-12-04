const unzipper = require("unzipper");
const fs = require("fs");
const archiver = require('archiver');

let config = require('./config');
let builder = require('xmlbuilder');

exports.yapexil2mef = function(path, debug=false) {
    let file = fs.createReadStream(path);
    this.yapexil2mefStream(file,debug);
}

const main_folder = 'mef/';
let metadata_flag = false; //Search for metadata.json file

global.informations = config.temp_info; //Used to store temp informations to compose Content.xml
let temp_test = {};
let folderCount = 1;
let metadata;

recursiveGetInfo = function(path, debug){
    fs.readdir(path, {withFileTypes:true}, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        files.forEach(function (_file) {
            let full_path = path + "/" + _file.name;
            if (_file.isDirectory()) {
                recursiveGetInfo(full_path);
            }
            else{
                if (!full_path.match('.DS_Store')  && !full_path.match('__MAC')){

                    let file = getFilesInfo(full_path);
                    let folder = config.folders.find(_f => _f.name === file.folder);
                    if (folder !== undefined){
                        //console.log(file.name);
                        if(file.name !== 'metadata.json'){
                            //Search for EMBEDDABLES folder
                            if(file.folder === "embeddables"){

                                if(config.imageExtensions.includes(file.extension)){
                                    fs.mkdir(main_folder + folder.mef_img, { recursive: true }, (err) => {
                                        if (err) throw err;
                                        fs.copyFile(path + "/" + _file.name, main_folder + folder.mef_img + file.name, function () {
                                            global.informations['images'].push(file.name);
                                            if(debug)
                                                console.log(main_folder + folder.mef_img + file.name);


                                        })
                                    });
                                }
                                else{
                                    fs.mkdir(main_folder + folder.mef_other, { recursive: true }, (err) => {
                                        if (err) throw err;
                                        fs.copyFile(path + "/" + _file.name, main_folder + folder.mef_other + file.name, function () {
                                            global.informations['images'].push(file.name);
                                            if(debug)
                                                console.log(main_folder + folder.mef_img + file.name);
                                        })
                                    });
                                }
                            }
                            else{
                                //Save STATEMENT file's path
                                fs.mkdir(main_folder + folder.mef, { recursive: true }, async (err) => {
                                    if (err) throw err;

                                    if(file.extension !== undefined){
                                        if(config.statementExtensions.includes(file.extension)) //SEARCH FOR HTML, PDF, DOCS  statements
                                            fs.copyFile(path + "/" + _file.name, main_folder + folder.mef + file.name, function () {
                                                global.informations['statement'] = file.name;
                                            });

                                        else if (file.folder === 'tests'){ //SEARCH FOR TESTS FILES
                                            if(temp_test[file.nextfolder] === undefined){
                                                temp_test[file.nextfolder] = {
                                                    name: 'T' + folderCount.toString(),
                                                    in: '',
                                                    out: '',
                                                    folder: 'T' + folderCount.toString() +'/'
                                                }
                                                folderCount ++;
                                            }

                                            if(file.name.includes('in'))
                                                temp_test[file.nextfolder].in = file.name;
                                            else
                                                temp_test[file.nextfolder].out = file.name;

                                            await fs.mkdir(main_folder + folder.mef + temp_test[file.nextfolder].folder, { recursive: true }, async (err) => {
                                                if (err) throw err;
                                                fs.copyFile(path + "/" + _file.name, main_folder + folder.mef + temp_test[file.nextfolder].folder + file.name, function () {

                                                })
                                            });
                                        }

                                        else{ //SEARCH FOR OTHER FILES
                                            if(file.folder !== undefined)
                                                fs.copyFile(path + "/" + _file.name, main_folder + folder.mef + file.name, function () {
                                                    //console.log(main_folder + folder.mef + file.name);

                                                    global.informations[file.folder].push(file.name);
                                                });
                                        }

                                        if(debug)
                                            console.log(main_folder + folder.mef + file.name);
                                    }
                                });
                            }
                        }
                        else{
                            if(file.folder === 'metadata.json' && file.name === 'metadata.json'){
                                metadata_flag = true;

                                fs.readFile(path + "/" + _file.name, (err, data) => {
                                    if (err) throw err;
                                    global.informations['metadata'] = JSON.parse(data.toString()); //Save METADATA
                                    metadata =  JSON.parse(data.toString());
                                });

                                if(debug)
                                    console.log(main_folder + file.name);
                            }
                        }
                    }
                }
            }
        });
    });
}

exports.yapexil2mefStream = async function (file, debug=false) {

    if(debug)
        console.log("START UNZIPPING ...");

    file.pipe(unzipper.Extract({ path: '/tmp/temp_mef' }))
        .on('finish', function () {
        console.log("Fine");
        recursiveGetInfo('/tmp/temp_mef', true);
        console.log(metadata);
    });
}

getFilesInfo = function (fileName){
    let extension = fileName.split(".")[1];

    let temp_name = fileName.split("/");
    let name = temp_name[temp_name.length-1];

    return {
        name: name,
        extension: extension,
        folder:temp_name[3],
        nextfolder: temp_name[4],
        fullPath: fileName
    }
}

normalizeTests = function (test) {
    let r = [];
    for (let key in test)
        r.push(test[key])

    return r;
}

zipping = function (){
    // create a file to stream archive data to.
    const output = fs.createWriteStream('mef.zip');
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            throw err;
        }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
        throw err;
    });

    // append files from a sub-directory
    archive.directory('mef/', false);

    // pipe archive data to the file
    archive.pipe(output);

    archive.finalize();

    return archive;
}