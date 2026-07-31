-- DropForeignKey
ALTER TABLE "vans" DROP CONSTRAINT "vans_driverId_fkey";

-- AddForeignKey
ALTER TABLE "vans" ADD CONSTRAINT "vans_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
