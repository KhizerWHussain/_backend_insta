-- CreateTable
CREATE TABLE "TaggedPost" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,
    "postId" INTEGER NOT NULL,
    "taggedUserId" INTEGER NOT NULL,

    CONSTRAINT "TaggedPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaggedPost_postId_taggedUserId_key" ON "TaggedPost"("postId", "taggedUserId");

-- AddForeignKey
ALTER TABLE "TaggedPost" ADD CONSTRAINT "TaggedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaggedPost" ADD CONSTRAINT "TaggedPost_taggedUserId_fkey" FOREIGN KEY ("taggedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
