import { ProgressBar } from "../src/progress";

describe("Single Progress Bar", () => {
  const total = 100;
  const bar = new ProgressBar(total);

  describe("Testing ProgressBar.tick()", () => {
    it("progress.count should be 0", () => {
      expect(bar.count).toBe(0);
    });

    it("progress.count should be 10", () => {
      bar.tick(10);
      expect(bar.count).toBe(10);
    });

    it("percertange should be 10%", () => {
      expect(bar.count / total).toBe(0.1);
    });
  });
});
