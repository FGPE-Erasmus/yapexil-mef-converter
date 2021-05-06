const fs = require('fs');
const archiver = require('archiver');
const unzipper = require('unzipper');
const builder = require('xmlbuilder');

const { METADATA_FILENAME, YAPEXIL_FOLDER_NAMES } = require('./constants');
const { DEFAULT_OPTIONS } = require('./default-options');
const {
  toObject,
  extractValueOrDefault,
  getExtension,
  map2MooshakDifficulty,
  applyTemplate,
  map2MooshakType,
  correctorFrom
} = require('./utils');

async function yapexil2mef(pathToZip, outputPath = 'output.zip', options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const zipStream = fs.createReadStream(pathToZip);
  const outputStream = fs.createWriteStream(outputPath);
  await yapexil2mefStream(zipStream, outputStream, options);
  zipStream.close();
  outputStream.close();
}

async function yapexil2mefStream(zipStream, outputStream, options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);

  // unzip & parse YAPExIL archive
  const { metadata, catalog } = await parseZipEntries(zipStream, options);

  // build new catalog
  const newCatalog = {};
  await processEmbeddables(newCatalog, metadata, catalog.embeddables, options);
  await processInstructions(newCatalog, metadata, catalog.instructions, options);
  await processLibraries(newCatalog, metadata, catalog.libraries, options);
  await processSkeletons(newCatalog, metadata, catalog.skeletons, options);
  await processStatements(newCatalog, metadata, catalog.statements, options);
  await processSolutions(newCatalog, metadata, catalog.solutions, options);
  await processStaticCorrectors(newCatalog, metadata, catalog['static-correctors'], options);
  await processDynamicCorrectors(newCatalog, metadata, catalog['dynamic-correctors'], options);
  await processTestsets(newCatalog, metadata, catalog.testsets, options);
  await processTests(newCatalog, metadata, catalog.tests, options);
  await processTemplates(newCatalog, metadata, catalog.templates, options);
  await processTestGenerators(newCatalog, metadata, catalog['test-generators'], options);
  await processFeedbackGenerators(newCatalog, metadata, catalog['feedback-generators'], options);
  await generateRootXml(newCatalog, metadata, options);

  // create archive
  const archive = createArchive(outputStream);
  for (const entryKey in newCatalog) {
    if (Object.hasOwnProperty.call(newCatalog, entryKey)) {
      archive.append(newCatalog[entryKey], { name: entryKey });
    }
  }
  return await archive.finalize();
}

async function parseZipEntries(zipStream, options) {
  let metadata = {};
  const catalog = {};
  const zipEntries = zipStream.pipe(unzipper.Parse({ forceStream: true }));
  for await (const entry of zipEntries) {
    const fileName = entry.path;
    const type = entry.type;
    if (type === 'File') {
      if (options.ignoreFiles.indexOf(fileName) > -1) {
        entry.autodrain();
        continue;
      }
      let match;
      if ((match = fileName.match(new RegExp('^(' + YAPEXIL_FOLDER_NAMES.join('|') + ')/([^/]+)/', 'i')))) {
        catalog[match[1]] = catalog[match[1]] || [];
        catalog[match[1]][match[2]] = catalog[match[1]][match[2]] || [];
        catalog[match[1]][match[2]].push({
          path: fileName,
          buffer: await entry.buffer()
        });
      } else if (fileName === METADATA_FILENAME) {
        const content = await entry.buffer();
        metadata = { ...JSON.parse(content.toString()) };
      } else {
        entry.autodrain();
      }
    } else {
      entry.autodrain();
    }
  }
  return { metadata, catalog };
}

function createArchive(outputStream) {
  const archive = archiver('zip', { level: 9 });
  archive.on('error', (err) => { throw err; });
  archive.pipe(outputStream);
  return archive;
}

async function processStaticCorrectors(newCatalog, metadata, staticCorrectors, options) {
  if (!staticCorrectors) {
    return;
  }
  const commands = [];
  for (const id of Object.keys(staticCorrectors)) {
    const entries = toObject(staticCorrectors[id], 'path');
    const rootEntry = entries[`static-correctors/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const targetEntry = entries[`static-correctors/${id}/${submetadata.pathname}`];
    newCatalog[submetadata.pathname] = targetEntry.buffer;
    commands.push(submetadata.command_line.replace('$FILE', submetadata.pathname));
  }
  newCatalog['static_corrector.sh'] = Buffer.from(correctorFrom(commands), 'utf-8');
  metadata.Static_corrector = '/bin/sh static_corrector.sh';
}

async function processDynamicCorrectors(newCatalog, metadata, dynamicCorrectors, options) {
  if (!dynamicCorrectors) {
    return;
  }
  const commands = [];
  for (const id of Object.keys(dynamicCorrectors)) {
    const entries = toObject(dynamicCorrectors[id], 'path');
    const rootEntry = entries[`dynamic-correctors/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const targetEntry = entries[`dynamic-correctors/${id}/${submetadata.pathname}`];
    newCatalog[submetadata.pathname] = targetEntry.buffer;
    commands.push(submetadata.command_line.replace('$FILE', submetadata.pathname));
  }
  newCatalog['dynamic_corrector.sh'] = Buffer.from(correctorFrom(commands), 'utf-8');
  metadata.Dynamic_corrector = '/bin/sh dynamic_corrector.sh';
}

async function processEmbeddables(newCatalog, metadata, embeddables, options) {
  if (!embeddables) {
    return;
  }
  let i = 1;
  for (const id of Object.keys(embeddables)) {
    const entries = toObject(embeddables[id], 'path');
    const rootEntry = entries[`embeddables/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const targetEntry = entries[`embeddables/${id}/${submetadata.pathname}`];
    const extension = getExtension(submetadata.pathname);
    if (options.imageExtensions.includes(extension)) {
      newCatalog[`images/${submetadata.pathname}`] = targetEntry.buffer;
    }
  }
}

async function processInstructions(newCatalog, metadata, instructions, options) {
  if (!instructions) {
    return;
  }
  for (const id of Object.keys(instructions)) {
    const entries = toObject(instructions[id], 'path');
    const rootEntry = entries[`instructions/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const targetEntry = entries[`instructions/${id}/${submetadata.pathname}`];
    newCatalog[submetadata.pathname] = targetEntry.buffer;
  }
}

async function processLibraries(newCatalog, metadata, libraries, options) {
  if (!libraries) {
    return;
  }
  for (const id of Object.keys(libraries)) {
    const entries = toObject(libraries[id], 'path');
    const rootEntry = entries[`libraries/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.toString());
    const targetEntry = entries[`libraries/${id}/${submetadata.pathname}`];
    newCatalog[submetadata.pathname] = targetEntry.buffer;
  }
}

async function processSkeletons(newCatalog, metadata, skeletons, options) {
  if (!skeletons) {
    return;
  }
  let i = 1;
  metadata.skeletons = [];
  for (const id of Object.keys(skeletons)) {
    const entries = toObject(skeletons[id], 'path');
    const rootEntry = entries[`skeletons/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const targetEntry = entries[`skeletons/${id}/${submetadata.pathname}`];
    const name = `SK${i++}`;
    newCatalog[`skeletons/${name}/${submetadata.pathname}`] = targetEntry.buffer;
    metadata.skeletons.push({
      Skeleton: submetadata.pathname,
      Show: 'yes',
      Extension: getExtension(submetadata.pathname),
      'xml:id': `skeletons.${name}`
    });
  }
}

async function processSolutions(newCatalog, metadata, solutions, options) {
  if (!solutions) {
    return;
  }
  let i = 1;
  metadata.solutions = [];
  for (const id of Object.keys(solutions)) {
    const entries = toObject(solutions[id], 'path');
    const rootEntry = entries[`solutions/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const targetEntry = entries[`solutions/${id}/${submetadata.pathname}`];

    newCatalog[`solutions/${submetadata.pathname}`] = targetEntry.buffer;

    metadata.solutions.push(`solutions/${submetadata.pathname}`);
  }
}

async function processStatements(newCatalog, metadata, statements, options) {
  if (!statements) {
    return;
  }
  metadata.statements = {};
  for (const id of Object.keys(statements)) {
    const entries = toObject(statements[id], 'path');
    const rootEntry = entries[`statements/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const targetEntry = entries[`statements/${id}/${submetadata.pathname}`];
    
    newCatalog[submetadata.pathname] = targetEntry.buffer;

    metadata.statements[submetadata.format] = submetadata.pathname;
  }
}

async function processTemplates(newCatalog, metadata, templates, options) {
  if (!templates) {
    return;
  }
  for (const id of Object.keys(templates)) {
    const entries = toObject(templates[id], 'path');
    const rootEntry = entries[`templates/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const targetEntry = entries[`templates/${id}/${submetadata.pathname}`];

    const extension = getExtension(submetadata.pathname);
    metadata.skeletons.forEach(skeleton => {
      if (skeleton.Extension === extension) {
        const skeletonEntryKey = skeleton['xml:id'].replace('.', '/') + '/' + skeleton.Skeleton;
        newCatalog[skeletonEntryKey] = Buffer.from(applyTemplate(
          targetEntry.buffer.toString('utf8'),
          newCatalog[skeletonEntryKey].toString('utf8')
        ), 'utf8');
      }
    });

    metadata.solutions.forEach(solution => {
      const solutionExtension = getExtension(solution);
      if (solutionExtension === extension) {
        newCatalog[solution] = Buffer.from(applyTemplate(
          targetEntry.buffer.toString('utf8'),
          newCatalog[solution].toString('utf8')
        ), 'utf8');
      }
    });
  }
}

async function processFeedbackGenerators(newCatalog, metadata, feedbackGenerators, options) {
  if (!feedbackGenerators) {
    return;
  }
  // Do NOTHING !
}

async function processTestGenerators(newCatalog, metadata, testGenerators, options) {
  if (!testGenerators) {
    return;
  }
  // Do NOTHING !
}

async function processTests(newCatalog, metadata, tests, options, setPrefix = '', setWeight = -1, setVisible = true) {
  if (!tests) {
    return;
  }
  let i = 1;
  metadata.tests = metadata.tests || [];
  for (const id of Object.keys(tests)) {
    const entries = toObject(tests[id], 'path');
    const rootEntry = entries[`tests/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const name = `${setPrefix}T${i++}`;
    const inputEntry = entries[`tests/${id}/${submetadata.input}`];
    newCatalog[`tests/${name}/${submetadata.input}`] = inputEntry.buffer;
    const outputEntry = entries[`tests/${id}/${submetadata.output}`];
    newCatalog[`tests/${name}/${submetadata.output}`] = outputEntry.buffer;
    let points = 0;
    if (setWeight > 0 && submetadata.weight >= 0) {
      points = submetadata.weight / setWeight;
    } else {
      points = submetadata.weight;
    }
    if (points > 0 && points < 1) {
      points = Math.round(points * 100);
    }
    metadata.tests.push({
      'xml:id': `tests.${name}`,
      Feedback: '',
      Points: points,
      Result: '',
      Show: setVisible && submetadata.visible === true ? 'Yes' : 'No',
      SolutionErrors: '',
      Timeout: extractValueOrDefault(submetadata.arguments, '--timeout', ''),
      args: submetadata.arguments.join(' '),
      context: '',
      input: submetadata.input,
      output: submetadata.output,
      Fatal: '',
      Warning: '',
    });
  }
}

async function processTestsets(newCatalog, metadata, testsets, options) {
  if (!testsets) {
    return;
  }
  let i = 1;
  for (const id of Object.keys(testsets)) {
    const entries = toObject(testsets[id], 'path');
    const rootEntry = entries[`testsets/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const weight = submetadata.weight;
    const visible = submetadata.visible;
    const name = `S${i++}`;

    const subentries = {};
    for (const pathname of Object.keys(entries)) {
      const subpathname = pathname.substr(`testsets/${id}/`.length);
      if (subpathname.startsWith('tests/')) {
        const testId = subpathname.substring('tests/'.length, subpathname.indexOf('/', 'tests/'.length + 1));
        subentries[testId] = subentries[testId] || [];
        subentries[testId].push({
          ...entries[pathname],
          path: subpathname
        });
      }
    }
    await processTests(newCatalog, metadata, subentries, options, name, weight, visible);
  }
}

async function generateRootXml(newCatalog, metadata, options) {
  const root = builder.create("Problem", {
    version: "1.0",
    encoding: "UTF-8",
    standalone: false,
  });
  root.att({
    xmlns: "http://www.ncc.up.pt/mooshak/",
    Color: "#000000",
    Description: metadata.statements.html || metadata.statements.txt || metadata.statements.markdown || '',
    Difficulty: map2MooshakDifficulty(metadata.difficulty),
    Editor_kind: map2MooshakType(metadata.type),
    Environment: '',
    Name: metadata.title,
    Original_location: `https://fgpe-project.usz.edu.pl/authorkit/ui/exercises/${metadata.id}`,
    PDF: metadata.statements.pdf || '',
    Program: '',
    Start: '',
    Stop: '',
    Dynamic_corrector: metadata.Dynamic_corrector,
    Static_corrector: metadata.Static_corrector,
    Timeout: extractValueOrDefault(metadata.platform, '--timeout', ''),
    Title: metadata.module ? `${metadata.module} - ${metadata.title}` : metadata.title,
    Type: '',
    Fatal: '',
    Warning: '',
  });

  const testsEle = root.ele('Tests', {
    'xml:id': 'tests',
    Definition: '',
    Fatal: '',
    Warning: '',
  });
  if (metadata.tests) {
    for (const test of metadata.tests) {
      testsEle.ele('Test', test);
    }
  }
  
  const skeletonsEle = root.ele("Skeletons", {
    Show: 'yes',
    'xml:id': 'skeletons'
  });
  if (metadata.skeletons) {
    for (const skeleton of metadata.skeletons) {
      skeletonsEle.ele('Skeleton', skeleton);
    }
  }
  
  root.ele('Solutions', {
    'xml:id': 'solutions',
    Fatal: '',
    Warning: ''
  });

  root.ele('Images', {
    Fatal: '',
    Warning: '',
    'xml:id': 'images'
  });

  const xml = root.end({ pretty: true });

  newCatalog['Content.xml'] = Buffer.from(xml, 'utf-8');
}

module.exports = {
  yapexil2mef,
  yapexil2mefStream
};
