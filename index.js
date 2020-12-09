const unzipper = require("unzipper");
const fs = require("fs");
const archiver = require('archiver');
const stream = require('stream');

let config = require('./config');
let builder = require('xmlbuilder');

let timestamp = Date.now().toString();
let main_folder ;
let temp_path ;

exports.yapexil2mef = async function (input_path, output_path='/tmp/yapexiltomef/', debug=false) {
    main_folder = output_path + '_' + timestamp + '/';
    temp_path = '/tmp/temp_mef_' + timestamp + "/";
    if(debug)
        console.log("START UNZIPPING ...");

    await createFolders(debug);

    let info = await readZip(input_path,debug);
    if(info.metadata !== ''){
        let content = await generateContent(info);
        fs.writeFileSync(main_folder + 'Content.xml',content);
    }
    if(debug)
        console.log("Start zipping...");

    let zip = await zipping(output_path);
    console.log(zip);
    console.log("FINISH!");

    return zip;
}

readZip = async function(pathFile,debug) {
    let metadata_flag = false; //Search for metadata.json file

    let informations = config.temp_info; //Used to store temp informations to compose Content.xml
    let temp_test = {};
    let temp_skeleton = {};
    let folderCountTest = 1;
    let folderCountSkeleton = 1;
    let metadata;

    const directory = await unzipper.Open.file(pathFile);

    return new Promise( (resolve, reject) => {
        fs.createReadStream(pathFile).pipe(unzipper.Extract({ path: temp_path })).on('close',function () {
            let files = directory.files
            //TODO ADD debug!!
            for (let x in files){
                if(files[x].type === 'File' && !files[x].path.match('__MACOS') && !files[x].path.match('.DS_Store')){
                    let full_path = directory.files[x].path;
                    let file = getFilesInfo(full_path);
                    let folder = config.folders.find(_f => _f.name === file.folder);

                    if (folder !== undefined){
                        if(file.folder === "embeddables"){
                            if(config.imageExtensions.includes(file.extension)){ //Save IMAGE files
                                files[x]
                                    .stream()
                                    .pipe(fs.createWriteStream(main_folder + folder.mef_img + file.name))
                                    .on('error',reject)
                                    .on('finish',resolve)
                                informations['images'].push(file.name);

                            }
                            else if (file.name !== "metadata.json"){ //Save OTHER files
                                files[x]
                                    .stream()
                                    .pipe(fs.createWriteStream(main_folder + folder.mef_other + file.name))
                                    .on('error',reject)
                                    .on('finish',resolve)
                                informations[folder.name] = file.name;
                            }
                        }
                        else if (file.folder === "statements") {
                            if (config.statementExtensions.includes(file.extension)) { //Save STATEMENT files
                                files[x]
                                    .stream()
                                    .pipe(fs.createWriteStream(main_folder + folder.mef + file.name))
                                    .on('error', reject)
                                    .on('finish', resolve)
                                informations[folder.name] = file.name;
                            }
                        }
                        else if (file.folder === 'tests'){ //Save and organize TESTS files
                            if(temp_test[file.nextfolder] === undefined){
                                temp_test[file.nextfolder] = {
                                    name: 'T' + folderCountTest.toString(),
                                    in: '',
                                    out: '',
                                    folder: 'T' + folderCountTest.toString() +'/',
                                    metadata: ''
                                }
                                folderCountTest ++;
                            }

                            if(file.name.includes('in'))
                                temp_test[file.nextfolder].in = file.name;
                            else if(file.name.includes('out'))
                                temp_test[file.nextfolder].out = file.name;
                            else
                                temp_test[file.nextfolder].metadata = main_folder + folder.mef + temp_test[file.nextfolder].folder + file.name;

                            if(file.name.includes('in')) //Used only to not create duplicates
                                informations[folder.name].push(temp_test[file.nextfolder]);

                            fs.mkdir(main_folder + folder.mef + temp_test[file.nextfolder].folder, { recursive: true }, async (err) => {
                                if (err) throw err;

                                fs.copyFileSync(temp_path + files[x].path, main_folder + folder.mef + temp_test[file.nextfolder].folder + file.name);
                            });
                        }
                        else if(file.folder === 'skeletons'){
                            if(temp_skeleton[file.nextfolder] === undefined){
                                temp_skeleton[file.nextfolder] = {
                                    name: 'T' + folderCountSkeleton.toString(),
                                    filename: '',
                                    folder: 'T' + folderCountSkeleton.toString() +'/'
                                }
                                folderCountSkeleton ++;
                            }

                            temp_skeleton[file.nextfolder].filename = file.name;
                            informations[folder.name].push(temp_skeleton[file.nextfolder]);

                            fs.mkdir(main_folder + folder.mef + temp_skeleton[file.nextfolder].folder, { recursive: true }, async (err) => {
                                if (err) throw err;
                                files[x]
                                    .stream()
                                    .pipe(fs.createWriteStream(main_folder + folder.mef + temp_skeleton[file.nextfolder].folder + file.name))
                                    .on('error',reject)
                                    .on('finish',resolve)

                            });
                        }
                        else if(file.folder === 'metadata.json' && file.name === 'metadata.json') {
                            metadata_flag = true;

                            fs.copyFileSync(temp_path + file.name, main_folder + file.name);

                            informations['metadata'] = main_folder + file.name;
                        }
                        else if (file.folder !== 'metadata.json' && file.name !== 'metadata.json') { //SEARCH FOR OTHER FILES
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
            }
            resolve(informations);
        });
    });

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

createFolders = async function (debug){
    if(debug)
        console.log("Creating folders...");

    return new Promise((resolve, reject) => {
        for (let f in config.folders_name){
            fs.mkdir(main_folder + config.folders_name[f],  { recursive: true },err => {
                if(err) throw err;
            });

        }
        resolve('Finish creating folders');
        reject('Error creating folders');
    });


}

generateContent = async function (info){
    return new Promise(  (resolve, reject) => {
        //Open and read metadata.json
        fs.createReadStream(info.metadata).on('data', function (chunk) {
            let meta = JSON.parse(chunk.toString());
            let emp = "";
            let root = builder.create('Problem',
                {version: '1.0', encoding: 'UTF-8', standalone: false});
            root.att({'xmlns':'http://www.ncc.up.pt/mooshak/',
                'Color':'#000000',
                'Description': info.statements, 'Difficulty': meta.difficulty, 'Dynamic_corrector': emp, 'Editor_kind': emp, 'Environment': emp,
                'Fatal': emp, 'Name': info.statements.split('.')[0], 'Original_location': emp, 'PDF': emp, 'Program': emp, 'Start': emp, 'Static_corrector': emp,
                'Stop': emp, 'Timeout': emp, 'Title': meta.title, 'Type': emp, 'Warning': emp,
            });
            root.ele('Solutions',{'Fatal': emp, 'Warning': emp, 'xml:id':'solutions'});
            let test = root.ele('Tests',{'Definition': emp, 'Fatal': emp, 'Warning': emp, 'xml:id':'tests'});
            for (let x of info.tests){
                let content = fs.readFileSync(x.metadata);
                let meta_test = JSON.parse(content.toString());

                test.ele('Test',{'Fatal': emp, 'Feedback': emp, 'Points': meta_test.weight,
                    'Result': emp, 'Show': meta_test.visible === true ? "Yes":"No", 'SolutionErrors': emp,
                    'Timeout': meta_test.arguments.indexOf('--timeout') !== -1 ? meta_test.arguments[meta_test.arguments.indexOf('--timeout') + 1] : emp,
                    'Warning': emp, 'args': meta_test.arguments.join(' '),
                    'context': emp, 'input': x.in, 'output': x.out,
                    'xml:id':'tests.' + x.name});

                fs.unlinkSync(x.metadata);
            }
            let skeleton = root.ele('Skeletons',{'Show': 'yes', 'xml:id':'skeletons'});
            for (let x of info.skeletons){
                skeleton.ele('Skeletons',{'Skeleton': x.filename, 'Show': 'yes',  'Extension': x.filename.split('.')[1], 'xml:id':'skeletons.' + x.name});
            }
            root.ele('Images',{'Fatal': emp, 'Warning': emp, 'xml:id':'images'});

            let xml = root.end({pretty:true});
            fs.unlinkSync(main_folder + 'metadata.json');

            console.log(xml);
            resolve(xml);
        });
    });
}

zipping = async function (output_path){
    let out_path = output_path + 'mef_' + timestamp + '.zip';
    return new Promise(  (resolve, reject) => {

        // create a file to stream archive data to.

        const output = fs.createWriteStream(out_path);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
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
            reject(err);
            throw err;
        });

        // append files from a sub-directory
        archive.directory(main_folder, false);

        // pipe archive data to the file
        archive.pipe(output);

        archive.finalize();

        archive.on('end', function (){
            // listen for all archive data to be written
            // 'close' event is fired only when a file descriptor is involved
            output.on('close', function() {
                console.log(archive.pointer() + ' total bytes');
                console.log('archiver has been finalized and the output file descriptor has closed.');

                fs.rmdirSync(main_folder,{recursive:true});

                resolve(out_path);
            });
        });
    });

}