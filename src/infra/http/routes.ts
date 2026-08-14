import { Router } from "express";
import type { ITokenService } from "../../domain/services/ITokenService.js";
import type { RouteController } from "./controllers/RouteController.js";
import type { StudentController } from "./controllers/StudentController.js";
import type { UserController } from "./controllers/UserController.js";
import type { VanController } from "./controllers/VanController.js";
import {
  createAuthMiddleware,
  requireDriver,
} from "./middlewares/authMiddleware.js";

export function buildRoutes(
  userController: UserController,
  vanController: VanController,
  studentController: StudentController,
  routeController: RouteController,
  tokenService: ITokenService,
): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(tokenService);

  //publico
  //user
  router.post("/users", (req, res) => userController.create(req, res));
  router.post("/login", (req, res) => userController.login(req, res));

  //autenticado

  //van
  router.post("/vans", authenticate, requireDriver, (req, res) =>
    vanController.create(req, res),
  );
  router.get("/vans/driver/:driverId", authenticate, (req, res) =>
    vanController.listByDriver(req, res),
  );

  //student
  router.post("/student/link", authenticate, requireDriver, (req, res) =>
    studentController.link(req, res),
  );

  router.get("/students/van/:vanId", authenticate, (req, res) =>
    studentController.listByVan(req, res),
  );

  router.post("/attendance/absence", authenticate, (req, res) =>
    studentController.registerAbsence(req, res),
  );

  router.get("/attendance/confirmed", authenticate, (req, res) =>
    studentController.listConfirmed(req, res),
  );

  //route
  router.post("/routes/generate", authenticate, requireDriver, (req, res) =>
    routeController.generate(req, res),
  );

  return router;
}
