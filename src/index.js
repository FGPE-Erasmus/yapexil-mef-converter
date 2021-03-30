const fs = require('fs');
const archiver = require('archiver');
const unzipper = require('unzipper');
const builder = require('xmlbuilder');

const { METADATA_FILENAME, YAPEXIL_FOLDER_NAMES } = require('./constants');
const { DEFAULT_OPTIONS } = require('./default-options');
const { toObject, extractValueOrDefault, getExtension, map2MooshakDifficulty } = require('./utils');

async function yapexil2mef(pathToZip, outputPath = 'output.zip', options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const zip = fs.createReadStream(pathToZip);
  return await yapexil2mefStream(zip, fs.createWriteStream(outputPath), options);
}

async function yapexil2mefStream(zipStream, outputStream, options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const { metadata, catalog } = await parseZipEntries(zipStream, options);
  const archive = createArchive(outputStream);
  await processDynamicCorrectors(archive, metadata, catalog['dynamic-correctors'], options);
  await processEmbeddables(archive, metadata, catalog.embeddables, options);
  await processFeedbackGenerators(archive, metadata, catalog['feedback-generators'], options);
  await processInstructions(archive, metadata, catalog.instructions, options);
  await processLibraries(archive, metadata, catalog.libraries, options);
  await processSkeletons(archive, metadata, catalog.skeletons, options);
  await processSolutions(archive, metadata, catalog.solutions, options);
  await processStatements(archive, metadata, catalog.statements, options);
  await processStaticCorrectors(archive, metadata, catalog['static-correctors'], options);
  await processTemplates(archive, metadata, catalog.templates, options);
  await processTestGenerators(archive, metadata, catalog['test-generators'], options);
  await processTestsets(archive, metadata, catalog.testsets, options);
  await processTests(archive, metadata, catalog.tests, options);
  await generateRootXml(archive, metadata, options);
  await archive.finalize();
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

async function processDynamicCorrectors(archive, metadata, dynamicCorrectors, options) {
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
    archive.append(targetEntry.buffer, { name: submetadata.pathname });
    commands.push(submetadata.command_line);
  }
  metadata.Dynamic_corrector = commands.join(' && ');
}

async function processEmbeddables(archive, metadata, embeddables, options) {
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
      archive.append(targetEntry.buffer, { name: `images/${submetadata.pathname}` });
    }
  }
}

async function processFeedbackGenerators(archive, metadata, feedbackGenerators, options) {
  if (!feedbackGenerators) {
    return;
  }
  // Do NOTHING !
}

async function processInstructions(archive, metadata, instructions, options) {
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
    archive.append(targetEntry.buffer, { name: submetadata.pathname });
  }
}

async function processLibraries(archive, metadata, libraries, options) {
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
    archive.append(targetEntry.buffer, { name: submetadata.pathname });
  }
}

async function processSkeletons(archive, metadata, skeletons, options) {
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
    archive.append(targetEntry.buffer, { name: `skeletons/${name}/${submetadata.pathname}` });
    metadata.skeletons.push({
      Skeleton: submetadata.pathname,
      Show: 'yes',
      Extension: getExtension(submetadata.pathname),
      'xml:id': `skeletons.${name}`
    });
  }
}

async function processSolutions(archive, metadata, solutions, options) {
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

    await archive.append(targetEntry.buffer, { name: `solutions/${submetadata.pathname}` });
  }
}

async function processStatements(archive, metadata, statements, options) {
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
    
    archive.append(targetEntry.buffer, { name: submetadata.pathname });

    metadata.statements[submetadata.format] = submetadata.pathname;
  }
}

async function processTemplates(archive, metadata, templates, options) {
  if (!templates) {
    return;
  }
  let i = 1;
  for (const id of Object.keys(templates)) {
    const entries = toObject(templates[id], 'path');
    const rootEntry = entries[`templates/${id}/${METADATA_FILENAME}`];
    if (!rootEntry) {
      continue;
    }
    const submetadata = JSON.parse(rootEntry.buffer.toString());
    const targetEntry = entries[`templates/${id}/${submetadata.pathname}`];
    
    archive.append(targetEntry.buffer, { name: submetadata.pathname });
  }
}

async function processTestGenerators(archive, metadata, testGenerators, options) {
  if (!testGenerators) {
    return;
  }
  // Do NOTHING !
}

async function processStaticCorrectors(archive, metadata, staticCorrectors, options) {
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
    archive.append(targetEntry.buffer, { name: submetadata.pathname });
    commands.push(submetadata.command_line);
  }
  metadata.Static_corrector = commands.join(' && ');
}

async function processTests(archive, metadata, tests, options, setPrefix = '', setWeight = -1, setVisible = true) {
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
    archive.append(inputEntry.buffer, {
      name: `tests/${name}/${submetadata.input}`
    });
    const outputEntry = entries[`tests/${id}/${submetadata.output}`];
    archive.append(outputEntry.buffer, {
      name: `tests/${name}/${submetadata.output}`
    });
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

async function processTestsets(archive, metadata, testsets, options) {
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
    await processTests(archive, metadata, subentries, options, name, weight, visible);
  }
}

async function generateRootXml(archive, metadata, options) {
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
    Editor_kind: 'CODE',
    Environment: '',
    Name: metadata.module ? `${metadata.module} - ${metadata.title}` : metadata.title,
    Original_location: `https://fgpe-project.usz.edu.pl/authorkit/ui/exercises/${metadata.id}`,
    PDF: metadata.statements.pdf || '',
    Program: '',
    Start: '',
    Stop: '',
    Dynamic_corrector: metadata.Dynamic_corrector,
    Static_corrector: metadata.Static_corrector,
    Timeout: extractValueOrDefault(metadata.platform, '--timeout', ''),
    Title: metadata.title,
    Type: '', // metadata.type
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

  await archive.append(Buffer.from(xml, 'utf-8'), { name: 'Content.xml' });
}

module.exports = {
  yapexil2mef,
  yapexil2mefStream
};
