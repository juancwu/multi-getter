import axios from "axios";
import { createWriteStream, WriteStream } from "fs";
import mime from "mime-types";
import { nanoid } from "nanoid";
import { EventEmitter } from "events";
import path from "path";

export default class Download extends EventEmitter {
  public totalBytes: number;
  public readBytes: number;
  public savepath: string;
  public filestream: WriteStream | null;
  public filename: string;

  constructor() {
    super();
    this.totalBytes = 0;
    this.readBytes = 0;
    this.savepath = "";
    this.filestream = null;
    this.filename = "";
  }

  public get(url: string, dir: string, givenFilename?: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await axios({
          method: "get",
          url: url,
          responseType: "stream",
        });

        res.data;

        const headers = res.headers;

        if (headers["content-length"]) {
          this.totalBytes = Number(headers["content-length"]);
        }

        const type = headers["content-type"]
          ? mime.extension(headers["content-type"])
          : "mp4";

        this.filename =
          givenFilename || headers["content-disposition"]
            ? headers["content-disposition"].split("=")[1].replace(/['"]/g, "")
            : nanoid(6) + "." + type;

        this.savepath = path.join(dir, this.filename);

        this.filestream = createWriteStream(this.savepath.replace('"', ""));
        this.emit("start", this.savepath);
        res.data.on("data", this._ondata.bind(this));
        res.data.on("close", this._onclose.bind(this, resolve));
      } catch (error) {
        reject(error);
      }
    });
  }

  protected _ondata(chunk: Buffer) {
    this.readBytes += chunk.length;
    if (this.filestream) {
      this.filestream.write(chunk);
      this.emit("progress", chunk.length, this.readBytes, this.totalBytes);
    }
  }

  protected _onclose(resolve: (value: unknown) => void) {
    if (this.filestream) this.filestream.close();
    this.emit("done", this.savepath);
    resolve(null);
  }
}
