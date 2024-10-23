-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('WEB', 'ANDROID', 'IOS');

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "type" "DeviceType" NOT NULL DEFAULT 'ANDROID';
