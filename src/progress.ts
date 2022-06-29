// interface ProgressBar {
//   count: number;
//   total: number;
//   label?: string;
// }

import { nanoid } from "nanoid";
import readline from "readline";

const ESC = "\x1B";
const CSI = "[";
const PREVIOUS = "F";
const BACK = "D";

interface ProgressBarOptions {
  label?: string;
  barLength?: number;
  count?: number;
}

interface ProgressBarInput extends ProgressBarOptions {
  total: number;
}

export class ProgressBar {
  public total: number;
  public count: number;
  public label?: string;
  public barLength: number;
  public done: boolean;

  constructor(total: number, options: ProgressBarOptions = {}) {
    this.total = total;
    this.count = options.count ?? 0;
    this.label = options.label;
    this.barLength = options.barLength ?? 30;
    this.done = false;

    // truncate label if too long
    if (this.label && this.label.length > process.stdout.columns) {
      this.label =
        this.label.substring(
          0,
          Math.max(process.stdout.columns - 3, this.label.length)
        ) + "...";
    }
  }

  public update(prefix: string = "\r", suffix: string = "") {
    const numOfChar = Math.floor((this.count / this.total) * this.barLength);
    // let progressString = prefix + "[";
    process.stdout.write(prefix + "[");
    for (let i = 0; i < numOfChar; i++) {
      process.stdout.write("=");
      // progressString += "=";
    }

    if (this.count !== 0 && this.count < this.total) {
      process.stdout.write(ESC + CSI + BACK + ">");
      // progressString =
      //   progressString.substring(0, progressString.lastIndexOf("=")) + ">";
    }

    for (let i = 0; i < this.barLength - numOfChar; i++) {
      process.stdout.write(" ");
      // progressString += " ";
    }

    process.stdout.write(
      `] ${Math.floor((this.count / this.total) * 100)}% ${this.label}` + suffix
    );
    // progressString +=
    //   `] ${Math.floor((this.count / this.total) * 100)}% ${this.label}` +
    //   suffix;

    if (this.count === this.total) {
      this.done = true;
    }
  }

  public tick(value: number) {
    const expected = this.count + value;
    this.count = Math.min(expected, this.total);
  }
}

export class MultiProgress {
  public bars: Map<string, ProgressBar>;

  constructor() {
    this.bars = new Map<string, ProgressBar>();
  }

  public addBar(bar: ProgressBar | ProgressBarInput, givenId?: string) {
    const id = givenId ?? nanoid(6);
    if (bar instanceof ProgressBar) {
      this.bars.set(id, bar);
      return id;
    }

    const newBar = new ProgressBar(bar.total, {
      barLength: bar.barLength,
      count: bar.count,
      label: bar.label,
    });

    this.bars.set(id, newBar);

    return id;
  }

  public removeBar(id: string) {
    const rows = this.bars.size;
    if (this.bars.has(id)) {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < process.stdout.columns; j++) {
          process.stdout.write(" ");
        }
        process.stdout.write("\n");
      }
      this.bars.delete(id);
      process.stdout.write(ESC + CSI + rows + PREVIOUS);
      this.update();
    }
  }

  public tick(id: string, value: number) {
    const bar = this.bars.get(id);

    if (bar) {
      bar.tick(value);
    }
  }

  public update() {
    const done: boolean[] = [];
    this.bars.forEach((bar) => {
      bar.update("", "\n");
      done.push(bar.done);
    });

    if (done.every((isDone) => isDone)) {
      // clear console
      // const blank = '\n'.repeat(process.stdout.rows)
      // console.log(blank)
      // readline.cursorTo(process.stdout, 0, 0)
      // readline.clearScreenDown(process.stdout)
      console.log("\n");
    }

    process.stdout.write(ESC + CSI + this.bars.size + PREVIOUS);
  }
}
