import { Download } from "../src";
import rimraf from "rimraf";
import { existsSync } from "fs";
import path from "path";
let download = new Download();
describe("Test download files", () => {
  beforeEach(() => {
    rimraf("./tests/media", {}, (error) => {
      if (error) console.log(error);
    });
  });

  afterAll(() => {
    rimraf("./tests/media", {}, (error) => {
      if (error) console.log(error);
    });
  });

  describe("When given a non-existing directory", () => {
    it("should create the non-existing directory", async () => {
      let exists = existsSync("./tests/media");

      expect(exists).toBe(false);

      await download.get(
        "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fcdn1.tnwcdn.com%2Fwp-content%2Fblogs.dir%2F1%2Ffiles%2F2016%2F06%2FGoogle-Material-Design-Logo.jpg&f=1&nofb=1",
        "./tests/media"
      );

      exists = existsSync("./tests/media");

      expect(exists).toBe(true);
    });
  });
});
