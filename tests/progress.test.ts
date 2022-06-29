import { MultiProgress, ProgressBar } from "../src/progress";

const total = 10;
const barLength = 10;
const label = "test";

const bracketsCallNum = 2;
const arrowCallNum = 1;
const cursorRepositionCallNum = 1;

const ESC = "\x1B";
const CSI = "[";
const PREVIOUS = "F";
const BACK = "D";

describe("Single Progress Bar", () => {
  let singleBar: ProgressBar;
  let stdoutSpy: jest.SpyInstance;
  beforeAll(() => {
    stdoutSpy = jest.spyOn(process.stdout, "write");
  });

  beforeEach(() => {
    stdoutSpy.mockReset();
    singleBar = new ProgressBar(total, {
      barLength: barLength,
      label: label,
    });
  });

  describe("Test tick()", () => {
    it("progress.count should be 0", () => {
      expect(singleBar.count).toBe(0);
    });

    it("progress.count should be 10", () => {
      singleBar.tick(10);
      expect(singleBar.count).toBe(10);
    });
  });

  describe("Test update()", () => {
    it("should print out empty progress bar", () => {
      // let expectedString = "\r[          ] 0% test";
      singleBar.update();
      // expect(stdoutSpy).toHaveBeenCalledWith(expectedString);
      expect(stdoutSpy).toHaveBeenCalledTimes(
        singleBar.barLength + bracketsCallNum
      );
    });

    it("should print out progress bar with 3 '=' characters", () => {
      singleBar.tick(3);
      singleBar.update();
      expect(singleBar.count).toBe(3);
      expect(stdoutSpy).toHaveBeenCalledTimes(
        singleBar.barLength + bracketsCallNum + arrowCallNum
      );

      const expectedParts = [
        "\r[",
        "=",
        "=",
        "=",
        ESC + CSI + BACK + ">",
        " ",
        " ",
        " ",
        " ",
        " ",
        " ",
        " ",
        "] 30% test",
      ];

      for (let i = 0; i < expectedParts.length; i++) {
        expect(stdoutSpy).nthCalledWith(i + 1, expectedParts[i]);
      }
    });
  });
});

describe("Multiple Progress Bar", () => {
  let multiBar: MultiProgress;
  let stdoutSpy: jest.SpyInstance;
  beforeAll(() => {
    // create spy on stdout.write
    stdoutSpy = jest.spyOn(process.stdout, "write");
  });

  beforeEach(() => {
    // reset spy on stdout.write
    stdoutSpy.mockReset();
    multiBar = new MultiProgress();
  });

  // test addBar()
  describe("Test addBar()", () => {
    it("should add a bar with ProgressBarOptions", () => {
      const barId = multiBar.addBar({
        total: total,
        barLength: barLength,
        label: label,
      });
      expect(typeof barId === "string").toBe(true);
      expect(multiBar.bars.has(barId)).toBe(true);
    });

    it("should add a bar with ProgressBar instance", () => {
      const barId = multiBar.addBar(
        new ProgressBar(total, {
          barLength: barLength,
          label: label,
        })
      );
      expect(typeof barId === "string").toBe(true);
      expect(multiBar.bars.has(barId)).toBe(true);
    });
  });

  describe("Test removeBar()", () => {
    it("should remove a bar", () => {
      const barId = multiBar.addBar(
        new ProgressBar(total, {
          barLength: barLength,
          label: label,
        })
      );
      multiBar.removeBar(barId);
      expect(multiBar.bars.has(barId)).toBe(false);
    });
  });

  // test tick()
  describe("Test tick()", () => {
    it("should increase count to 10", () => {
      const increase = 10;
      const id = multiBar.addBar(
        new ProgressBar(total, {
          barLength: barLength,
          label: label,
        })
      );

      multiBar.tick(id, increase);
      expect(multiBar.bars.get(id)).toBeTruthy();
      expect(multiBar.bars.get(id)?.count).toBe(increase);
    });

    it("should not increase when count is equal to total", () => {
      const increase = 10;
      const id = multiBar.addBar(
        new ProgressBar(total, {
          barLength: barLength,
          label: label,
          count: total,
        })
      );

      multiBar.tick(id, increase);
      expect(multiBar.bars.get(id)).toBeTruthy();
      expect(multiBar.bars.get(id)?.count).toBe(total);
    });
  });

  // test update()
  describe("Test update()", () => {
    it("should print out 0 progress bar", () => {
      multiBar.update();
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
    });

    it("should print out 10 progress bar (empty progress bars)", () => {
      const n = 10;
      for (let i = 0; i < n; i++) {
        multiBar.addBar(
          new ProgressBar(total, {
            barLength: barLength,
            label: label,
          })
        );
      }
      multiBar.update();
      expect(stdoutSpy).toHaveBeenCalledTimes(
        (barLength + bracketsCallNum) * total + cursorRepositionCallNum
      );
    });

    it("should print out 10 progress bar (filled progress bars)", () => {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const id = multiBar.addBar(
          new ProgressBar(total, {
            barLength: barLength,
            label: label,
          })
        );
        multiBar.tick(id, total);
      }
      multiBar.update();
      expect(stdoutSpy).toHaveBeenCalledTimes(
        (barLength + bracketsCallNum) * total + cursorRepositionCallNum
      );
    });

    it("should print out 10 progress bar (with 30%)", () => {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const id = multiBar.addBar(
          new ProgressBar(total, {
            barLength: barLength,
            label: label,
          })
        );
        multiBar.tick(id, 3);
      }
      multiBar.update();
      expect(stdoutSpy).toHaveBeenCalledTimes(
        (barLength + bracketsCallNum + arrowCallNum) * total +
          cursorRepositionCallNum
      );
    });
  });
});
