import Download from "./download";
import EventEmitter from "events";
import { MultiProgress } from "./progress";

export class Manager extends EventEmitter {
  public tasks: Buffer[];
  public mp: MultiProgress;

  constructor() {
    super();
    this.tasks = [];
    this.mp = new MultiProgress();
  }

  public addTask(data: Buffer) {
    this.tasks.push(data);
    this.emit("data");
  }

  public startTask() {
    for (let i = 0; i < this.tasks.length && this.mp.bars.size < 5; i++) {
      const buf = this.tasks.pop();

      if (buf) {
        this._startTask(buf);
      }
    }
  }

  protected _check() {
    if (this.tasks.length > 0) {
      this.emit("data");
    } else {
      process.exit(0);
    }
  }

  protected _startTask(data: Buffer) {
    // start downloads
    // should get url dest filename?
    const info = data.toString();
    const parts = info.split(" ");

    if (parts.length < 1) {
      throw Error("Provide a url.");
    }

    const use = {
      url: parts[0],
      dest: parts.length > 1 ? parts[1] : process.cwd(),
      filename: parts.length > 2 ? parts[2] : undefined,
    };

    const download = new Download();
    const barId = this.mp.addBar({
      total: 0,
      count: 0,
      label: use.url,
      barLength: 30,
    });
    download.on("progress", (bytes: number) => {
      this.mp.tick(barId, bytes);
      this.mp.update();
    });

    download.once("start", (savepath: string) => {
      const bar = this.mp.bars.get(barId);
      if (bar) {
        bar.total = download.totalBytes;
        bar.label = download.filename;
        this.mp.bars.set(barId, bar);
      }
    });

    download.once("done", () => {
      this.mp.removeBar(barId);
      download.removeAllListeners("progress");
      this._check();
    });

    download.get(use.url, use.dest, use.filename).catch(() => {
      download.removeAllListeners("progress");
      this.mp.removeBar(barId);
      this._check();
    });
  }
}
