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

// Use Cases - User
import { CreateUserUseCase } from "../useCases/user/CreateUserUseCase.js";
import { LoginUseCase } from "../useCases/user/LoginUseCase.js";
import { UpdateUserUseCase } from "../useCases/user/UpdateUserUseCase.js";
import { DeleteUserUseCase } from "../useCases/user/DeleteUserCase.js";

// Use Cases - Van
import { CreateVanUseCase } from "../useCases/van/CreateVanUseCase.js";
import { ListDriverVansUseCase } from "../useCases/van/ListDriverVansUseCase.js";
import { UpdateVanUseCase } from "../useCases/van/UpdateVanUseCase.js";
import { DeleteVanUseCase } from "../useCases/van/DeleteVanUseCase.js";

// Use Cases - Student
import { LinkStudentToVanUseCase } from "../useCases/student/LinkStudentToVanUseCase.js";
import { UnlinkStudentToVanUseCase } from "../useCases/student/UnlinkStudentToVanUseCase.js";
import { UpdateStudentUseCase } from "../useCases/student/UpdateStudentUseCase.js";
import { DeleteStudentUseCase } from "../useCases/student/DeleteStudentUseCase.js";
import { ListVanStudentUseCase } from "../useCases/student/ListVanStudentUseCase.js";
import { RegisterAbsenceUseCase } from "../useCases/student/RegisterAbsenceUseCase.js";

// Use Cases - Driver
import { UpdateDriverUseCase } from "../useCases/driver/UpdateDriverUseCase.js";
import { DeleteDriverUseCase } from "../useCases/driver/DeleteDriverUseCase.js";

// Use Cases - Attendance / Route
import { ListConfirmedAttendanceUseCase } from "../useCases/attendance/ListConfirmedAttendanceUseCase.js";
import { GenerateRouteComparisonUseCase } from "../useCases/route/GenerateRouteComparisonUseCase.js";

// Controllers
import { UserController } from "../infra/http/controllers/UserController.js";
import { VanController } from "../infra/http/controllers/VanController.js";
import { StudentController } from "../infra/http/controllers/StudentController.js";
import { DriverController } from "../infra/http/controllers/DriverController.js";
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
  // Repositories
  const userRepository = new PrismaUserRepository();
  const vanRepository = new PrismaVanRepository();
  const driverRepository = new PrismaDriverRepository();
  const studentRepository = new PrismaStudentRepository();
  const attendanceRepository = new PrismaAttendanceRepository();
  const routeRepository = new PrismaRouteRepository();

  // Serviços
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(assertEnv("JWT_SECRET"));
  const routeCalculator = new HaversineRouteCalculatorService();

  // Use Cases - User
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
  const updateUserUseCase = UpdateUserUseCase.create(userRepository);
  const deleteUserUseCase = DeleteUserUseCase.create(
    userRepository,
    driverRepository,
    studentRepository,
  );

  // Use Cases - Van
  const createVanUseCase = CreateVanUseCase.create(
    vanRepository,
    userRepository,
  );
  const listDriverVansUseCase = ListDriverVansUseCase.create(vanRepository);
  const updateVanUseCase = UpdateVanUseCase.create(vanRepository);
  const deleteVanUseCase = DeleteVanUseCase.create(
    vanRepository,
    studentRepository,
  );

  // Use Cases - Student
  const linkStudentToVanUseCase = LinkStudentToVanUseCase.create(
    vanRepository,
    studentRepository,
  );
  const unlinkStudentToVanUseCase = UnlinkStudentToVanUseCase.create(
    studentRepository,
    vanRepository,
  );
  const updateStudentUseCase = UpdateStudentUseCase.create(studentRepository);
  const deleteStudentUseCase = DeleteStudentUseCase.create(studentRepository);
  const listVanStudentUseCase = ListVanStudentUseCase.create(studentRepository);
  const registerAbsenceUseCase = RegisterAbsenceUseCase.create(
    attendanceRepository,
    studentRepository,
  );

  // Use Cases - Driver
  const updateDriverUseCase = UpdateDriverUseCase.create(driverRepository);
  const deleteDriverUseCase = DeleteDriverUseCase.create(driverRepository);

  // Use Cases - Attendance / Route
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

  // Controllers
  const userController = new UserController(
    createUserUseCase,
    updateUserUseCase,
    deleteUserUseCase,
    loginUseCase,
  );
  const vanController = new VanController(
    createVanUseCase,
    updateVanUseCase,
    deleteVanUseCase,
    listDriverVansUseCase,
  );
  const studentController = new StudentController(
    linkStudentToVanUseCase,
    unlinkStudentToVanUseCase,
    updateStudentUseCase,
    deleteStudentUseCase,
    listVanStudentUseCase,
    registerAbsenceUseCase,
    listConfirmedAttendanceUseCase,
  );
  const driverController = new DriverController(
    updateDriverUseCase,
    deleteDriverUseCase,
  );
  const routeController = new RouteController(generateRouteComparisonUseCase);

  // Express + rotas
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
    driverController,
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
