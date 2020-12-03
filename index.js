const unzipper = require("unzipper");
const fs = require("fs");

let config = require('./config');
let builder = require('xmlbuilder');

exports.yapexil2mef = function(path, debug=false) {
    let file = fs.createReadStream(path);
    this.yapexil2mefStream(file,debug);
}

exports.yapexil2mefStream = async function (file, debug=false) {
    let metadata_flag = false; //Search for metadata.json file
    const main_folder = 'mef/';
    let folders = config.folders;
    let informations = config.temp_info; //Used to store temp informations to compose Content.xml
    let temp_test = {};
    let folderCount = 1;

    if(debug)
        console.log("START UNZIPPING ...");

    file
        .pipe(unzipper.Parse())
        .on('entry', async function (entry) {

            if(entry.path[0] !== '_' && !entry.path.includes('.DS_Store')){ //Check macOS file
                const data_raw = await entry.buffer();
                let file = await getFilesInfo(entry.path);
                //console.log(file.name, file.folder);

                for (const x in folders){
                    let folder = folders[x];
                    if (file.folder === folder.name){ //If FILE is in some FOLDERS
                        if(file.name !== 'metadata.json'){

                            //Search for EMBEDDABLES folder
                            if(file.folder === "embeddables"){

                                if(config.imageExtensions.includes(file.extension)){
                                    await fs.mkdir(main_folder + folder.mef_img, { recursive: true }, async(err) => {
                                        if (err) throw err;
                                        await fs.writeFile(main_folder + folder.mef_img + file.name,data_raw, function () {
                                            informations['images'].push(file.name);
                                            if(debug)
                                                console.log(main_folder + folder.mef_img + file.name);
                                        })

                                    });
                                }
                                else{
                                    await fs.mkdir(main_folder + folder.mef_other, { recursive: true }, (err) => {
                                        if (err) throw err;
                                        fs.writeFile(main_folder + folder.mef_other + file.name,data_raw, function () {
                                            informations['problem_root'].push(file.name);
                                            if(debug)
                                                console.log(main_folder + folder.mef_other + file.name);

                                        });

                                    });
                                }
                            }
                            else{
                                //Save STATEMENT file's path


                                await fs.mkdir(main_folder + folder.mef, { recursive: true }, async (err) => {
                                    if (err) throw err;

                                        if(file.extension !== undefined){

                                            if(config.statementExtensions.includes(file.extension)) //SEARCH FOR HTML, PDF, DOCS  statements
                                                await fs.writeFile(main_folder + folder.mef + file.name,data_raw, async function () {
                                                    informations['statement'] = file.name;
                                                });

                                            else if (file.folder === 'tests'){ //SEARCH FOR TESTS FILES
                                                console.log(file.nextfolder);
                                                console.log(file.name);
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

                                                console.log(main_folder + folder.mef + temp_test[file.nextfolder].folder);
                                                console.log(main_folder + folder.mef + temp_test[file.nextfolder].folder + file.name);
                                                await fs.mkdir(main_folder + folder.mef + temp_test[file.nextfolder].folder, { recursive: true }, async (err) => {
                                                    if (err) throw err;
                                                    await fs.writeFile(main_folder + folder.mef + temp_test[file.nextfolder].folder + file.name,data_raw, function () {

                                                    })
                                                });
                                            }

                                            else{ //SEARCH FOR OTHER FILES
                                                if(file.folder !== undefined)
                                                    await fs.writeFile(main_folder + folder.mef + file.name,data_raw, async function () {
                                                        informations[file.folder].push(file.name);
                                                    });
                                            }


                                            if(debug)
                                                console.log(main_folder + folder.mef + file.name);
                                        }
                                    });
                            }
                        }
                    }
                }
                //Search for METADATA.JSON
                if(file.folder === 'metadata.json' && file.name === 'metadata.json'){
                    metadata_flag = true;
                    informations['metadata'] = JSON.parse(data_raw.toString()); //Save METADATA

                    if(debug)
                        console.log(main_folder + file.name);
                }

                entry.autodrain(); //Load next file
            }
        })
        .on('finish',async function (finish){
            if(metadata_flag){
                //informations['tests'].push(Object.values(temp_test).in);
                informations['tests'] = normalizeTests(temp_test);
                //console.log(informations['tests'][0].name);
                console.log(informations);
            }
            else
                console.error("No metadata.json file found!");
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

normalizeTests = function (test) {
    let r = [];
    for (let key in test)
        r.push(test[key])

    return r;
}