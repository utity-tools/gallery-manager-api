import { User } from "@prisma/client";

export class UserDTO {
  id: string;
  email: string;
  name: string;
  slug: string;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.slug = user.slug;
    // NO passwordHash, googleId, type, avatarUrl, createdAt, updatedAt
  }
}
