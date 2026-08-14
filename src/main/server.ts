import "dotenv/config";
import express from "express";
import cors from "cors";

// Repositories concretos
import { PrismaUserRepository } from "../infra/repositories/PrismaUserRepository.js";
import { PrismaVanRepository } from "../infra/repositories/PrismaVanRepository.js";
import { PrismaDriverRepository } from "../infra/repositories/PrismaDriverRepository.js";
import { PrismaStudentRepository } from "../infra/repositories/PrismaStudentRepository.js";
import { PrismaAttendanceRepository } from "../infra/repositories/PrismaAttendanceRepository.js";
import { PrismaRouteRepository } from "../infra/repositories/PrismaRouteRepository.js";

// Serviços concretos
import { BcryptPasswordHasher } from "../infra/services/BcryptPasswordHasher.js";
import { JwtTokenService } from "../infra/services/JwtTokenService.js";
import { HaversineRouteCalculatorService } from "../infra/services/HaversineRouteCalculatorService.js";

// Use Cases
import { CreateUserUseCase } from "../useCases/user/CreateUserUseCase.js";
import { LoginUseCase } from "../useCases/user/LoginUseCase.js";
import { CreateVanUseCase } from "../useCases/van/CreateVanUseCase.js";
import { ListDriverVansUseCase } from "../useCases/van/ListDriverVansUseCase.js";
import { LinkStudentToVanUseCase } from "../useCases/student/LinkStudentToVanUseCase.js";
import { ListVanStudentUseCase } from "../useCases/student/ListVanStudentUseCase.js";
import { RegisterAbsenceUseCase } from "../useCases/student/RegisterAbsenceUseCase.js";
import { ListConfirmedAttendanceUseCase } from "../useCases/attendance/ListConfirmedAttendanceUseCase.js";
import { GenerateRouteComparisonUseCase } from "../useCases/route/GenerateRouteComparisonUseCase.js";

// Controllers
import { UserController } from "../infra/http/controllers/UserController.js";
import { VanController } from "../infra/http/controllers/VanController.js";
import { StudentController } from "../infra/http/controllers/StudentController.js";
import { RouteController } from "../infra/http/controllers/RouteController.js";

// Rotas
import { buildRoutes } from "../infra/http/routes.js";

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

function bootstrap() {
  //Repositories
  const userRepository = new PrismaUserRepository();
  const vanRepository = new PrismaVanRepository();
  const driverRepository = new PrismaDriverRepository();
  const studentRepository = new PrismaStudentRepository();
  const attendanceRepository = new PrismaAttendanceRepository();
  const routeRepository = new PrismaRouteRepository();

  //Serviços
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(assertEnv("JWT_SECRET"));
  const routeCalculator = new HaversineRouteCalculatorService();

  //Use Cases
  const createUserUseCase = CreateUserUseCase.create(
    userRepository,
    driverRepository,
    studentRepository,
    passwordHasher,
  );
  const loginUseCase = LoginUseCase.create(
    userRepository,
    driverRepository,
    studentRepository,
    passwordHasher,
    tokenService,
  );
  const createVanUseCase = CreateVanUseCase.create(
    vanRepository,
    userRepository,
  );
  const listDriverVansUseCase = ListDriverVansUseCase.create(vanRepository);
  const linkStudentToVanUseCase = LinkStudentToVanUseCase.create(
    vanRepository,
    studentRepository,
  );
  const listVanStudentUseCase = ListVanStudentUseCase.create(studentRepository);
  const registerAbsenceUseCase = RegisterAbsenceUseCase.create(
    attendanceRepository,
    studentRepository,
  );
  const listConfirmedAttendanceUseCase = ListConfirmedAttendanceUseCase.create(
    studentRepository,
    attendanceRepository,
  );
  const generateRouteComparisonUseCase = GenerateRouteComparisonUseCase.create(
    vanRepository,
    studentRepository,
    attendanceRepository,
    routeRepository,
    routeCalculator,
  );

  //Controllers
  const userController = new UserController(createUserUseCase, loginUseCase);
  const vanController = new VanController(
    createVanUseCase,
    listDriverVansUseCase,
  );
  const studentController = new StudentController(
    linkStudentToVanUseCase,
    listVanStudentUseCase,
    registerAbsenceUseCase,
    listConfirmedAttendanceUseCase,
  );
  const routeController = new RouteController(generateRouteComparisonUseCase);

  //Express + rotas
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  const routes = buildRoutes(
    userController,
    vanController,
    studentController,
    routeController,
    tokenService,
  );
  app.use("/api", routes);

  const port = process.env.PORT ?? 3000;
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}

bootstrap();
