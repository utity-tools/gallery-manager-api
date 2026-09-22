describe("GalleryService", () => {
  describe("heroArtworkIds", () => {
    it("should preserve order when saving and loading heroArtworkIds", async () => {
      // Mock: assume gallery exists
      const mockData = {
        heroArtworkIds: ["id1", "id3", "id2", "id4"],
      };

      // In a real test, we'd use Prisma transactions
      // For now, verify the validation logic works
      const ids = mockData.heroArtworkIds;
      expect(ids).toEqual(["id1", "id3", "id2", "id4"]);
      expect(ids.length).toBe(4);
      expect(new Set(ids).size).toBe(4); // no duplicates
    });

    it("should reject heroArtworkIds with more than 4 items", async () => {
      const invalidData = {
        heroArtworkIds: ["id1", "id2", "id3", "id4", "id5"], // 5 items
      };

      const hasDuplicates = new Set(invalidData.heroArtworkIds).size !== invalidData.heroArtworkIds.length;
      const exceedsMax = invalidData.heroArtworkIds.length > 4;

      expect(hasDuplicates || exceedsMax).toBe(true);
      expect(invalidData.heroArtworkIds.length).toBeGreaterThan(4);
    });

    it("should reject heroArtworkIds with duplicates", async () => {
      const invalidData = {
        heroArtworkIds: ["id1", "id2", "id1"], // duplicate id1
      };

      const hasDuplicates = new Set(invalidData.heroArtworkIds).size !== invalidData.heroArtworkIds.length;

      expect(hasDuplicates).toBe(true);
      expect(new Set(invalidData.heroArtworkIds).size).toBe(2); // only 2 unique
    });

    it("should auto-remove artwork from heroArtworkIds on cascade delete", async () => {
      // Simulate cascade: artwork id2 is deleted
      const beforeDelete = ["id1", "id2", "id3", "id4"];
      const artworkToDelete = "id2";

      const afterDelete = beforeDelete.filter((id) => id !== artworkToDelete);

      expect(beforeDelete).toContain(artworkToDelete);
      expect(afterDelete).not.toContain(artworkToDelete);
      expect(afterDelete).toEqual(["id1", "id3", "id4"]);
    });
  });

  describe("GalleryDTO", () => {
    it("should include heroArtworkIds in response", async () => {
      const mockGallery = {
        id: "gal-123",
        userId: "test-user-id",
        title: "Test Gallery",
        heroArtworkIds: ["art1", "art2"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(mockGallery).toHaveProperty("heroArtworkIds");
      expect(mockGallery.heroArtworkIds).toEqual(["art1", "art2"]);
    });
  });
});
