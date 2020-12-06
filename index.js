const unzipper = require("unzipper");
const fs = require("fs");
const archiver = require('archiver');
const stream = require('stream');

let config = require('./config');
let builder = require('xmlbuilder');

exports.yapexil2mef = function(path, debug=false) {
    //let file = fs.createReadStream(path);
    this.yapexil2mefStream(path,debug);
}


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

    console.log(createFolders(debug));

    let info = await readZip(file,debug);
    console.log(info);
    if(info.metadata !== ''){
        let x = await generateContent(info);
        console.log(x);
    }

    console.log("FINISH!");

}

getFilesInfo = function (fileName){
    let extension = fileName.split(".")[1];

    let temp_name = fileName.split("/");
    let name = temp_name[temp_name.length-1];

    return {
        name: name,
        extension: extension,
        folder:temp_name[0],
        nextfolder: temp_name[1],
        fullPath: fileName
    }
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

readZip =  async function(pathFile,debug) {
    const directory = await unzipper.Open.file(pathFile);
    await fs.createReadStream(pathFile).pipe(unzipper.Extract({ path: '/tmp/temp_mef' }));

    const main_folder = 'mef/';
    let metadata_flag = false; //Search for metadata.json file

    let informations = config.temp_info; //Used to store temp informations to compose Content.xml
    let temp_test = {};
    let folderCount = 1;
    let metadata;

    return new Promise( (resolve, reject) => {
        let files = directory.files
        //TODO ADD debug!!
        for (let x in files){
            if(files[x].type === 'File' && !files[x].path.match('__MACOS') && !files[x].path.match('.DS_Store')){
                let full_path = directory.files[x].path;
                let file = getFilesInfo(full_path);
                let folder = config.folders.find(_f => _f.name === file.folder);

                if (folder !== undefined){
                    if(file.name !== 'metadata.json'){
                        if(file.folder === "embeddables"){

                            if(config.imageExtensions.includes(file.extension)){ //Save IMAGE files
                                files[x]
                                    .stream()
                                    .pipe(fs.createWriteStream(main_folder + folder.mef_img + file.name))
                                    .on('error',reject)
                                    .on('finish',resolve)
                                informations['images'].push(file.name);

                            }
                            else { //Save OTHER files
                                files[x]
                                    .stream()
                                    .pipe(fs.createWriteStream(main_folder + folder.mef_other + file.name))
                                    .on('error',reject)
                                    .on('finish',resolve)
                                informations['problemroot'].push(file.name);
                            }
                        }
                        else{
                            if(config.statementExtensions.includes(file.extension)){ //Save STATEMENT files
                                files[x]
                                    .stream()
                                    .pipe(fs.createWriteStream(main_folder + folder.mef + file.name))
                                    .on('error',reject)
                                    .on('finish',resolve)
                                informations[folder.name] = file.name;
                            }
                            else if (file.folder === 'tests'){ //Save and organize TESTS files
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

                                //if(!informations['tests']['name'].match(temp_test[file.nextfolder]['name']))
                                // TODO remove duplicates of T<number> from Information dictionary!!
                                    informations[folder.name].push(temp_test[file.nextfolder]);

                                fs.mkdir(main_folder + folder.mef + temp_test[file.nextfolder].folder, { recursive: true }, async (err) => {
                                    if (err) throw err;
                                    files[x]
                                        .stream()
                                        .pipe(fs.createWriteStream(main_folder + folder.mef + temp_test[file.nextfolder].folder + file.name))
                                        .on('error',reject)
                                        .on('finish',resolve)

                                });
                            }
                            else{ //SEARCH FOR OTHER FILES
                                if (file.folder !== undefined){
                                    files[x]
                                        .stream()
                                        .pipe(fs.createWriteStream(main_folder + folder.mef + file.name))
                                        .on('error',reject)
                                        .on('finish',resolve)
                                    informations[file.folder].push(file.name);
                                }
                                if(debug)
                                    console.log(main_folder + folder.mef + file.name);

                            }
                        }
                    }
                    else{
                        if(file.folder === 'metadata.json' && file.name === 'metadata.json') {
                            metadata_flag = true;

                            fs.copyFileSync('/tmp/temp_mef/' + file.name, main_folder + file.name);

                            informations['metadata'] = main_folder + file.name;

                        }
                    }
                }
            }
        }
        resolve(informations);
    });

}

generateContent = async function (info){
    return new Promise(  (resolve, reject) => {
        //Open and read metadata.json
        fs.createReadStream(info.metadata).on('data', function (chunk) {
            //console.log(JSON.parse(chunk.toString()));
            let root = builder.create('Problem',
                {version: '1.0', encoding: 'UTF-8', standalone: false},
                {pubID: null, sysID: null});

            let xml = root.end({pretty:true});
            resolve(xml);
        });
    });
}

createFolders = function (debug){
    const main_folder = 'mef/';
    if(debug)
        console.log("Creating folders...");

        return new Promise((resolve, reject) => {
            for (let f in config.folders_name){
                console.log(main_folder + config.folders_name[f]);
                fs.mkdir(main_folder + config.folders_name[f],  { recursive: true },err => {
                    if(err) throw err;
                });

            }
            resolve('Finish creating folders');
            reject('Error creating folders');
        });


}