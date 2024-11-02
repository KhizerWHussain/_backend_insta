-- CreateTable
CREATE TABLE "LikeStory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,
    "storyId" INTEGER NOT NULL,
    "likedByUserId" INTEGER NOT NULL,

    CONSTRAINT "LikeStory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LikeStory" ADD CONSTRAINT "LikeStory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikeStory" ADD CONSTRAINT "LikeStory_likedByUserId_fkey" FOREIGN KEY ("likedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
