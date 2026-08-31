import { Router } from "express";
import type { ITokenService } from "../../domain/services/ITokenService.js";
import type { RouteController } from "./controllers/RouteController.js";
import type { StudentController } from "./controllers/StudentController.js";
import type { UserController } from "./controllers/UserController.js";
import type { VanController } from "./controllers/VanController.js";
import type { DriverController } from "./controllers/DriverController.js";
import {
  createAuthMiddleware,
  requireDriver,
  requireSelf,
} from "./middlewares/authMiddleware.js";

export function buildRoutes(
  userController: UserController,
  vanController: VanController,
  studentController: StudentController,
  driverController: DriverController,
  routeController: RouteController,
  tokenService: ITokenService,
): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(tokenService);

  // user
  router.post("/users", (req, res) => userController.create(req, res));
  router.post("/login", (req, res) => userController.login(req, res));
  router.patch("/users/:userId", authenticate, requireSelf, (req, res) =>
    userController.update(req, res),
  );
  router.delete("/users/:userId", authenticate, requireSelf, (req, res) =>
    userController.delete(req, res),
  );

  // van
  router.post("/vans", authenticate, requireDriver, (req, res) =>
    vanController.create(req, res),
  );
  router.patch("/vans/:vanId", authenticate, requireDriver, (req, res) =>
    vanController.update(req, res),
  );
  router.delete("/vans/:vanId", authenticate, requireDriver, (req, res) =>
    vanController.delete(req, res),
  );
  router.get("/vans/driver/:driverId", authenticate, (req, res) =>
    vanController.listByDriver(req, res),
  );

  // student
  router.post("/students/link", authenticate, requireDriver, (req, res) =>
    studentController.link(req, res),
  );
  router.post("/students/unlink", authenticate, requireDriver, (req, res) =>
    studentController.unlink(req, res),
  );
  router.patch("/students/:studentId", authenticate, (req, res) =>
    studentController.update(req, res),
  );
  router.delete("/students/:studentId", authenticate, (req, res) =>
    studentController.delete(req, res),
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

  // driver
  router.patch("/drivers/:driverId", authenticate, requireDriver, (req, res) =>
    driverController.update(req, res),
  );
  router.delete("/drivers/:driverId", authenticate, requireDriver, (req, res) =>
    driverController.delete(req, res),
  );

  // route
  router.post("/routes/generate", authenticate, requireDriver, (req, res) =>
    routeController.generate(req, res),
  );

  return router;
}
