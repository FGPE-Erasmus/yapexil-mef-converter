let config = {};

config.folders = [
    {
        name:'embeddables',
        yapexil:'embeddables/',
        mef_img: 'images/',
        mef_other: 'problemroot/'
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
    statement: "",
    tests : [],
    solutions:[],
    skeletons: [],
    images: [],
    problem_root:[]
}

module.exports = config;