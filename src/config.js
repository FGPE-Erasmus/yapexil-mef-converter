let config = {};

config.folders_name = ["images", "tests", "solutions", "skeletons"];

config.folders = [
    {
        name:'embeddables',
        yapexil:'embeddables/',
        mef_img: 'images/',
        mef_other: ''
    },
    {
        name:'statements',
        yapexil:'statements/',
        mef: ''
    },
    {
        name:'tests',
        yapexil:'tests/',
        mef: 'tests/'
    },
    {
        name:'solutions',
        yapexil:'solutions/',
        mef: 'solutions/'
    },
    {
        name:'skeletons',
        yapexil:'skeletons/',
        mef: 'skeletons/'
    },
    {
        name:'metadata.json',
        yapexil:'metadata.json',
        mef: 'metadata.json'
    },
];

config.imageExtensions = 'jpg bmp jpeg tif png';
config.statementExtensions = 'html pdf doc';
config.ignoreFiles = ['__MACOSX', '.DS_Store'];


config.temp_info = {
    metadata: "",
    statements: "",
    tests : [],
    solutions:[],
    skeletons: [],
    images: []
}

module.exports = config;