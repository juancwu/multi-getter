#!/usr/bin/env node

import { Command } from "commander";
import Download from "./download";
import { MultiProgress } from "./progress";
import { access } from "fs/promises";
import mkdirp from "mkdirp";
import { Manager } from "./manager";

const program = new Command("Downloader with progress bars");

program.version("v1.0.3");

const getcommand = program.command("get");
getcommand.description("Get a file from the internet.");
getcommand.argument("<url>", "URL of the file");
getcommand.argument(
  "[destination]",
  "Destination of the file. Defaults to current working directory.",
  process.cwd()
);
getcommand
  .option("-m, --multi <number>", "Allow parallel downloads.", true)
  .option("--no-multi", "Disbale parallel downloads.");
getcommand
  .option("--retry", "Allow retry upon failure. Max retries: 5.", true)
  .option("--no-retry", "Disbale retry on failire.");
getcommand.option("--name", "Filename");
getcommand.action(async (url: string, destination: string, options) => {
  const mp = new MultiProgress();
  const urls = url.split(",");

  try {
    await access(destination);
  } catch (error) {
    console.log("No access to directory:", destination);
    console.log("New directory will be created.");
    await mkdirp(destination);
  }

  const isMulti = options.multi;
  const allowRetry = options.retry;

  if (isMulti) {
    const promises = urls.map(async (url) => {
      return await start({
        url: url,
        retries: 0,
        retry: allowRetry,
        dest: destination,
        mp: mp,
        filename: options.name,
      });
    });

    await Promise.all(promises);
  } else {
    for (let url of urls) {
      await start({
        url: url,
        retries: 0,
        retry: allowRetry,
        dest: destination,
        mp: mp,
        filename: options.name,
      });
    }
  }
});

interface StartOptions {
  url: string;
  dest: string;
  retry: boolean;
  mp: MultiProgress;
  retries: number;
  filename?: string;
}

async function start(options: StartOptions) {
  const download = new Download();
  const barId = options.mp.addBar({
    total: 0,
    count: 0,
    barLength: 30,
    label: options.url,
  });

  download.on("progress", (bytes: number) => {
    options.mp.tick(barId, bytes);
    options.mp.update();
  });

  download.once("done", () => {
    options.mp.removeBar(barId);
  });

  download.once("start", (savepath: string) => {
    const bar = options.mp.bars.get(barId);
    if (bar) {
      bar.total = download.totalBytes;
      bar.label = download.filename;
      options.mp.bars.set(barId, bar);
    }
  });

  try {
    await download.get(options.url, options.dest, options.filename);
  } catch (error) {
    options.mp.removeBar(barId);
    download.removeAllListeners("progress");
    if (options.retry && options.retries < 5) {
      options.retries += 1;
      await start(options);
    }
  }
}

program.command("pipe").action(async () => {
  const manager = new Manager();
  manager.on("data", () => {
    manager.startTask();
  });

  // now take inputs from outside
  process.stdin.on("data", manager.addTask.bind(manager));
});

program.parse(process.argv);
