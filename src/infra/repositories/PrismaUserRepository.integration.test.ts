import { describe, it, expect, afterEach } from "vitest";
import { PrismaUserRepository } from "./PrismaUserRepository.js";
import { User } from "../../domain/entities/user/User.js";
import { prismaClient } from "../database/PrismaClient.js";

describe("PrismaUserRepository (integração)", () => {
  const sut = new PrismaUserRepository();
  const createdIds: string[] = [];

  afterEach(async () => {
    // limpa tudo que foi criado nesse teste, pra não sujar o banco de dev
    for (const id of createdIds) {
      await prismaClient.userModel.delete({ where: { id } }).catch(() => {
        // ignora se já não existir (ex: teste que testou o próprio delete)
      });
    }
    createdIds.length = 0;
  });

  const buildUser = (email: string) => {
    const result = User.create({
      name: "Ana Teste",
      email,
      password: "Senha123",
      phone: "41999999999",
      userType: "ALUNO",
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  it("deve criar e depois encontrar um usuário pelo id", async () => {
    const user = buildUser("teste-create@email.com");
    createdIds.push(user.id);

    await sut.create(user);

    const found = await sut.findById(user.id);

    expect(found).not.toBeNull();
    expect(found?.email.value).toBe("teste-create@email.com");
  });

  it("deve encontrar um usuário pelo e-mail", async () => {
    const user = buildUser("teste-findbyemail@email.com");
    createdIds.push(user.id);

    await sut.create(user);

    const found = await sut.findByEmail("teste-findbyemail@email.com");

    expect(found).not.toBeNull();
    expect(found?.id).toBe(user.id);
  });

  it("deve retornar null quando o e-mail não existe", async () => {
    const found = await sut.findByEmail("nao-existe@email.com");
    expect(found).toBeNull();
  });

  it("deve atualizar um usuário existente", async () => {
    const user = buildUser("teste-update@email.com");
    createdIds.push(user.id);
    await sut.create(user);

    const reloaded = await sut.findById(user.id);
    if (!reloaded) throw new Error("Falha ao recarregar fixture");

    // simula uma mudança: recria o usuário com outro nome, mesmo id (via reconstitute)
    const updated = User.reconstitute({
      id: reloaded.id,
      name: "Ana Atualizada",
      email: reloaded.email.value,
      hashedPassword: reloaded["props"].password.value,
      phone: reloaded.phone.value,
      userType: reloaded.userType.value,
    });

    await sut.update(updated);

    const afterUpdate = await sut.findById(user.id);
    expect(afterUpdate?.name.value).toBe("Ana Atualizada");
  });

  it("deve deletar um usuário", async () => {
    const user = buildUser("teste-delete@email.com");
    await sut.create(user);

    await sut.delete(user.id);

    const found = await sut.findById(user.id);
    expect(found).toBeNull();
    // não adiciona em createdIds, já foi deletado no próprio teste
  });
});
