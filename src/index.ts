#!/usr/bin/env node

// tslint:disable:no-console

import commander from 'commander';
import fs from 'fs';
import glob from 'glob';
import http from 'http';
import os from 'os';
import path from 'path';
import { encode } from 'plantuml-encoder';
import typescript from 'typescript';
import { tplant } from './tplant';

const AVAILABLE_PLANTUML_EXTENSIONS: string[] = ['svg', 'png', 'txt'];

commander
  .version(require('../package').version) // tslint:disable-line
  .option('-i, --input <path>', 'Define the path of the Typescript file')
  .option('-o, --output <path>', 'Define the path of the output file. If not defined, it\'ll output on the STDOUT')
  .option(
    '-p, --project <path>',
    'Compile a project given a valid configuration file.' +
      ' The argument can be a file path to a valid JSON configuration file,' +
      ' or a directory path to a directory containing a tsconfig.json file.'
  )
  .option('-A, --associations', 'Show associations between classes with cardinalities')
  .option('-F, --field-associations', 'Show associations between fields and classes with cardinalities')
  .option('-I, --only-interfaces', 'Only output interfaces')
  .option('-C, --only-classes', 'Only output classes')
  .option('-L, --colored-lines', 'Color association lines in random colors')
  .option('-f, --format <path>', 'Define the format of output')
  .option('-T, --targetClass <className>', 'Display class hierarchy diagram')
  .parse(process.argv);

if (!commander.input) {
  console.error('Missing input file');
  process.exit(1);
}

glob(<string>commander.input, {}, (err: Error | null, matches: string[]): void => {
  if (err !== null) {
    throw err;
  }

  const tsConfigFile: string | undefined = findTsConfigFile(<string>commander.input, <string | undefined>commander.tsconfig);

  const plantUMLDocument: string = tplant.convertToPlant(
    tplant.generateDocumentation(matches, getCompilerOptions(tsConfigFile)),
    {
      associations: <boolean>commander.associations,
      fieldAssociations: <boolean>commander.methodAssociations,
      onlyInterfaces: <boolean>commander.onlyInterfaces,
      format: <string>commander.format,
      targetClass: <string>commander.targetClass,
      onlyClasses: <boolean>commander.onlyClasses,
      coloredAssociationLines: <boolean>commander.coloredLines
    }
  );

  if (commander.output === undefined) {
    console.log(plantUMLDocument);

    return;
  }

  const extension: string = path.extname(<string>commander.output)
    .replace(/^\./gm, '');

  if (AVAILABLE_PLANTUML_EXTENSIONS.includes(extension)) {
    requestImageFile(<string>commander.output, plantUMLDocument, extension);

    return;
  }

  // tslint:disable-next-line non-literal-fs-path
  fs.writeFileSync(<string>commander.output, plantUMLDocument, 'utf-8');
});

function findTsConfigFile (inputPath: string, tsConfigPath?: string): string | undefined {
  if (tsConfigPath !== undefined) {
    // tslint:disable-next-line non-literal-fs-path
    const tsConfigStats: fs.Stats = fs.statSync(tsConfigPath);
    if (tsConfigStats.isFile()) {
      return tsConfigPath;
    }
    if (tsConfigStats.isDirectory()) {
      const tsConfigFilePath: string = path.resolve(tsConfigPath, 'tsconfig.json');
      // tslint:disable-next-line non-literal-fs-path
      if (fs.existsSync(tsConfigFilePath)) {
        return tsConfigFilePath;
      }
    }
  }

  const localTsConfigFile: string = path.resolve(path.dirname(inputPath), 'tsconfig.json');
  // tslint:disable-next-line non-literal-fs-path
  if (fs.existsSync(localTsConfigFile)) {
    return localTsConfigFile;
  }

  const cwdTsConfigFile: string = path.resolve(process.cwd(), 'tsconfig.json');
  // tslint:disable-next-line non-literal-fs-path
  if (fs.existsSync(cwdTsConfigFile)) {
    return cwdTsConfigFile;
  }

  return undefined;
}

function getCompilerOptions (tsConfigFilePath?: string): typescript.CompilerOptions {
  if (tsConfigFilePath === undefined) {
    return typescript.getDefaultCompilerOptions();
  }

  const reader: (path: string) => string | undefined =
    // tslint:disable-next-line non-literal-fs-path
    (filePath: string): string | undefined => fs.readFileSync(filePath, 'utf8');
  const configFile: { config?: { compilerOptions: typescript.CompilerOptions }; error?: typescript.Diagnostic } =
    typescript.readConfigFile(tsConfigFilePath, reader);

  if (configFile.error !== undefined && configFile.error.category === typescript.DiagnosticCategory.Error) {
    throw new Error(`unable to read tsconfig.json file at: ${tsConfigFilePath}.
             Error: ${typescript.flattenDiagnosticMessageText(configFile.error.messageText, os.EOL)}`);
  } else if (configFile.config === undefined) {
    throw new Error(`unable to read tsconfig.json file at: ${tsConfigFilePath}.`);
  }

  const convertedCompilerOptions: {
    options: typescript.CompilerOptions;
    errors: typescript.Diagnostic[];
  } = typescript.convertCompilerOptionsFromJson(configFile.config.compilerOptions, path.dirname(tsConfigFilePath));

  if (convertedCompilerOptions.errors.length > 0) {
    convertedCompilerOptions.errors.forEach((error: typescript.Diagnostic): void => {
      if (error.category === typescript.DiagnosticCategory.Error) {
        throw new Error(`unable to read tsconfig.json file at: ${tsConfigFilePath}.
                Error: ${typescript.flattenDiagnosticMessageText(error.messageText, os.EOL)}`);
      }
    });
  }

  return convertedCompilerOptions.options;
}

function requestImageFile (output: string, input: string, extension: string): void {
  http.get({
    host: 'www.plantuml.com',
    path: `/plantuml/${extension}/${encode(input)}`
  },
  (res: http.IncomingMessage): void => {
    // tslint:disable-next-line non-literal-fs-path
    const fileStream: fs.WriteStream = fs.createWriteStream(output);
    res.setEncoding('utf-8');
    res.pipe(fileStream);
    res.on('error', (err: Error): void => {
      throw err;
    });
  });
}
