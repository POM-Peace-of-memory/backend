/*
  Warnings:

  - A unique constraint covering the columns `[content]` on the table `Badge` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Badge_content_key" ON "Badge"("content");
