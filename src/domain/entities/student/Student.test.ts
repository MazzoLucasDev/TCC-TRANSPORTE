import { describe, it, expect } from "vitest";
import { Student } from "./Student.js";

describe("Student", () => {
  const validStudentData = {
    userId: "user-1",
    dateOfBirth: "2010-03-20",
    collectionPoint: { lat: -25.42, long: -49.27 },
  };

  it("deve criar um aluno válido", () => {
    const result = Student.create(validStudentData);
    expect(result.isRight()).toBe(true);
  });

  it("deve começar sem van vinculada", () => {
    const result = Student.create(validStudentData);
    if (result.isRight()) {
      expect(result.value.vanId).toBeNull();
      expect(result.value.isLinkedToVan()).toBe(false);
    }
  });

  it("deve rejeitar userId vazio", () => {
    const result = Student.create({ ...validStudentData, userId: "" });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar ponto de coleta inválido", () => {
    const result = Student.create({
      ...validStudentData,
      collectionPoint: { lat: 999, long: -49.27 },
    });
    expect(result.isLeft()).toBe(true);
  });

  describe("linkToVan / unlinkFromVan", () => {
    it("deve vincular a uma van", () => {
      const result = Student.create(validStudentData);
      if (result.isRight()) {
        const linked = result.value.linkToVan("van-1");
        expect(linked.vanId).toBe("van-1");
        expect(linked.isLinkedToVan()).toBe(true);
      }
    });

    it("deve desvincular da van", () => {
      const result = Student.create(validStudentData);
      if (result.isRight()) {
        const linked = result.value.linkToVan("van-1");
        const unlinked = linked.unlinkFromVan();
        expect(unlinked.vanId).toBeNull();
      }
    });
  });
});
