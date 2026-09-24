import { describe, expect, it } from "vitest";

import {
  applicableEndWarningsMs,
  assertRoomJoinWindow,
  deriveRoomStatus,
  legacyStatusFromDerived,
} from "@/lib/rooms/schedule";
import { AppError } from "@/lib/errors";

const start = new Date("2026-09-24T12:00:00.000Z");
const end = new Date("2026-09-24T13:00:00.000Z");
const schedule = { startTime: start, endTime: end };

describe("deriveRoomStatus", () => {
  it("is scheduled before startTime", () => {
    expect(
      deriveRoomStatus(schedule, new Date("2026-09-24T11:59:59.999Z")),
    ).toBe("scheduled");
  });

  it("is live at exact startTime", () => {
    expect(deriveRoomStatus(schedule, start)).toBe("live");
  });

  it("is live just before endTime", () => {
    expect(
      deriveRoomStatus(schedule, new Date("2026-09-24T12:59:59.999Z")),
    ).toBe("live");
  });

  it("is ended at exact endTime", () => {
    expect(deriveRoomStatus(schedule, end)).toBe("ended");
  });

  it("is ended after endTime", () => {
    expect(
      deriveRoomStatus(schedule, new Date("2026-09-24T13:00:00.001Z")),
    ).toBe("ended");
  });
});

describe("legacyStatusFromDerived", () => {
  it("maps derived statuses onto the DB enum", () => {
    expect(legacyStatusFromDerived("scheduled")).toBe("waiting");
    expect(legacyStatusFromDerived("live")).toBe("active");
    expect(legacyStatusFromDerived("ended")).toBe("ended");
  });
});

describe("assertRoomJoinWindow", () => {
  it("rejects before start", () => {
    expect(() =>
      assertRoomJoinWindow(schedule, new Date("2026-09-24T11:00:00.000Z")),
    ).toThrow(AppError);
  });

  it("allows at start", () => {
    expect(assertRoomJoinWindow(schedule, start)).toBe("live");
  });

  it("rejects at end", () => {
    expect(() => assertRoomJoinWindow(schedule, end)).toThrow(AppError);
  });
});

describe("applicableEndWarningsMs", () => {
  it("skips warnings longer than the meeting", () => {
    const short = {
      startTime: new Date("2026-09-24T12:00:00.000Z"),
      endTime: new Date("2026-09-24T12:07:00.000Z"),
    };
    expect(applicableEndWarningsMs(short)).toEqual([5 * 60 * 1000]);
  });

  it("includes both warnings for long meetings", () => {
    expect(applicableEndWarningsMs(schedule)).toEqual([
      10 * 60 * 1000,
      5 * 60 * 1000,
    ]);
  });
});
