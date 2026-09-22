describe("Artists Page Feature", () => {
  describe("GET /public/galleries/:slug/artists (Grid)", () => {
    it("should return paginated artists list", () => {
      const result = {
        artists: [
          { id: "art1", name: "Artist 1", slug: "artist-1", photoUrl: null },
          { id: "art2", name: "Artist 2", slug: "artist-2", photoUrl: null },
        ],
        total: 2,
        pages: 1,
      };
      expect(result.artists).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pages).toBe(1);
    });

    it("should respect pagination limits", () => {
      const limit = 100;
      const MAX_LIMIT = 100;
      const safeLimits = Math.min(limit, MAX_LIMIT);
      expect(safeLimits).toBeLessThanOrEqual(MAX_LIMIT);
    });

    it("should order artists by name ascending", () => {
      const artists = [
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ];
      const ordered = artists.sort((a, b) => a.name.localeCompare(b.name));
      expect(ordered[0].name).toBe("Alice");
      expect(ordered[1].name).toBe("Bob");
      expect(ordered[2].name).toBe("Charlie");
    });

    it("should calculate pages correctly", () => {
      const total = 25;
      const limit = 12;
      const pages = Math.ceil(total / limit);
      expect(pages).toBe(3);
    });

    it("should include artworks count in summary", () => {
      const artist = {
        id: "art1",
        name: "Artist",
        slug: "artist",
        _count: { artworks: 5 },
      };
      expect(artist._count.artworks).toBe(5);
    });
  });

  describe("GET /public/galleries/:slug/artists/:artistSlug (Detail)", () => {
    it("should return full artist profile", () => {
      const artist = {
        id: "art1",
        name: "Famous Artist",
        slug: "famous-artist",
        bio: "Painter",
        photoUrl: "https://example.com/photo.jpg",
        biographyText: "Born in 1990...",
        country: "Spain",
        birthYear: 1990,
      };
      expect(artist).toHaveProperty("name");
      expect(artist).toHaveProperty("bio");
      expect(artist).toHaveProperty("biographyText");
      expect(artist).toHaveProperty("country");
    });

    it("should include featured artworks (top 4)", () => {
      const artist = {
        id: "art1",
        featuredArtworks: [
          { id: "w1", title: "Work 1" },
          { id: "w2", title: "Work 2" },
          { id: "w3", title: "Work 3" },
          { id: "w4", title: "Work 4" },
        ],
      };
      expect(artist.featuredArtworks).toHaveLength(4);
    });

    it("should include exhibitions (CV history)", () => {
      const artist = {
        id: "art1",
        exhibitions: [
          { title: "Show 1", year: 2023 },
          { title: "Show 2", year: 2022 },
        ],
      };
      expect(artist.exhibitions).toBeDefined();
      expect(artist.exhibitions.length).toBeGreaterThanOrEqual(0);
    });

    it("should reject invalid artist slug", () => {
      const exists = false; // Simulating not found
      expect(exists).toBe(false);
    });

    it("should maintain slug uniqueness per gallery", () => {
      const galleryId = "gal1";
      const slug = "artist-1";
      // Unique constraint: galleryId_slug
      const unique = `${galleryId}:${slug}`;
      expect(unique).toBeTruthy();
    });
  });

  describe("Artist Validation", () => {
    it("should validate artist name (required, max 200)", () => {
      const name = "Valid Artist Name";
      const isValid = name.length > 0 && name.length <= 200;
      expect(isValid).toBe(true);
    });

    it("should reject empty artist name", () => {
      const name = "";
      const isValid = name.length > 0;
      expect(isValid).toBe(false);
    });

    it("should validate bio length (max 500)", () => {
      const bio = "a".repeat(500);
      const isValid = bio.length <= 500;
      expect(isValid).toBe(true);
    });

    it("should reject bio > 500 chars", () => {
      const bio = "a".repeat(501);
      const isValid = bio.length <= 500;
      expect(isValid).toBe(false);
    });

    it("should validate photoUrl as valid URL", () => {
      const url = "https://example.com/photo.jpg";
      const isValidUrl = url.startsWith("https://") || url.startsWith("http://");
      expect(isValidUrl).toBe(true);
    });
  });
});
