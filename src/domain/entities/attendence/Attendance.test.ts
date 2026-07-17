import { describe, it, expect } from "vitest";
import { Attendance } from "./Attendance.js";

describe("Attendance", () => {
  it("deve criar presença com status PRESENT por padrão (RF17)", () => {
    const result = Attendance.create({
      studentId: "student-1",
      date: "2026-07-17",
    });

    if (result.isRight()) {
      expect(result.value.status).toBe("PRESENT");
    }
  });

  it("deve rejeitar studentId vazio", () => {
    const result = Attendance.create({ studentId: "", date: "2026-07-17" });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar data inválida", () => {
    const result = Attendance.create({
      studentId: "student-1",
      date: "data-invalida",
    });
    expect(result.isLeft()).toBe(true);
  });

  describe("markAsAbsent / markAsPresent", () => {
    it("deve marcar como ausente", () => {
      const result = Attendance.create({
        studentId: "student-1",
        date: "2026-07-17",
      });
      if (result.isRight()) {
        const absent = result.value.markAsAbsent();
        expect(absent.status).toBe("ABSENT");
        expect(absent.isPresent()).toBe(false);
      }
    });

    it("não deve alterar o registro original (imutabilidade)", () => {
      const result = Attendance.create({
        studentId: "student-1",
        date: "2026-07-17",
      });
      if (result.isRight()) {
        result.value.markAsAbsent();
        expect(result.value.status).toBe("PRESENT"); // original continua presente
      }
    });
  });
});
