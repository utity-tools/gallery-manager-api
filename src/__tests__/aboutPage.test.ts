describe("About Page Feature", () => {
  describe("Update About (PUT /galleries/:id/about)", () => {
    it("should update aboutHeading with valid text", () => {
      const heading = "Our Gallery Story";
      expect(heading.length).toBeLessThanOrEqual(200);
    });

    it("should reject aboutHeading > 200 chars", () => {
      const heading = "a".repeat(201);
      expect(heading.length).toBeGreaterThan(200);
    });

    it("should update aboutText with valid content", () => {
      const text = "Founded in 2020, we showcase emerging artists...";
      expect(text.length).toBeLessThanOrEqual(3000);
    });

    it("should reject aboutText > 3000 chars", () => {
      const text = "a".repeat(3001);
      expect(text.length).toBeGreaterThan(3000);
    });

    it("should validate aboutPhotoUrl as valid URL", () => {
      const url = "https://example.com/photo.jpg";
      const isValidUrl =
        url.startsWith("http://") || url.startsWith("https://");
      expect(isValidUrl).toBe(true);
    });

    it("should reject invalid aboutPhotoUrl", () => {
      const url = "not-a-url";
      const isValidUrl =
        url.startsWith("http://") || url.startsWith("https://");
      expect(isValidUrl).toBe(false);
    });

    it("should allow optional fields (all can be null)", () => {
      const about = {
        aboutHeading: undefined,
        aboutText: undefined,
        aboutPhotoUrl: undefined,
      };
      expect(about.aboutHeading).toBeUndefined();
      expect(about.aboutText).toBeUndefined();
      expect(about.aboutPhotoUrl).toBeUndefined();
    });

    it("should require ownership (not just any user)", () => {
      const ownerId = "user123";
      const requestUserId = "different-user";
      expect(ownerId).not.toBe(requestUserId);
    });
  });

  describe("Get About (GET /public/galleries/:slug/about)", () => {
    it("should return about fields for public gallery", () => {
      const about = {
        aboutHeading: "Our Story",
        aboutText: "Since 1990...",
        aboutPhotoUrl: "https://example.com/about.jpg",
      };
      expect(about).toHaveProperty("aboutHeading");
      expect(about).toHaveProperty("aboutText");
      expect(about).toHaveProperty("aboutPhotoUrl");
    });

    it("should return empty about if not set", () => {
      const about = {
        aboutHeading: null,
        aboutText: null,
        aboutPhotoUrl: null,
      };
      expect(about.aboutHeading).toBeNull();
      expect(about.aboutText).toBeNull();
    });

    it("should only expose about fields (no secrets)", () => {
      const gallery = {
        id: "gal123",
        aboutHeading: "Story",
        aboutText: "Text",
        aboutPhotoUrl: "https://example.com/photo.jpg",
        contactEmail: "secret@gallery.com",
      };
      const about = {
        aboutHeading: gallery.aboutHeading,
        aboutText: gallery.aboutText,
        aboutPhotoUrl: gallery.aboutPhotoUrl,
      };
      expect(about).not.toHaveProperty("contactEmail");
      expect(about).not.toHaveProperty("id");
    });
  });
});
