import { prisma } from "@/lib/db"
import { Membership, Organization, User } from "@/prisma/client"

export const DEFAULT_ORG_ROLE = "CLIENT_VIEWER"
export const DEFAULT_OWNER_ROLE: OrganizationRole = "OWNER"

export type OrganizationRole = "OWNER" | "ADMIN" | "ANALYST" | "CLIENT_VIEWER"

function normalizeOrgSlug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  return normalized || "org"
}

async function getUniqueOrganizationSlug(baseSlug: string): Promise<string> {
  let candidate = normalizeOrgSlug(baseSlug)
  let attempt = 1

  while (true) {
    const exists = await prisma.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })

    if (!exists) {
      return candidate
    }

    attempt += 1
    candidate = `${normalizeOrgSlug(baseSlug)}-${attempt}`
  }
}

export async function createOrganization(name: string, slug: string): Promise<Organization> {
  return await prisma.organization.create({
    data: {
      name,
      slug,
    },
  })
}

export async function createOrganizationForUser(user: User): Promise<Membership> {
  const displayName = user.businessName || `${user.name} Organization`
  const slugBase = user.businessName || user.email.split("@")[0] || `org-${user.id.slice(0, 8)}`
  const uniqueSlug = await getUniqueOrganizationSlug(slugBase)

  return await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: displayName,
        slug: uniqueSlug,
      },
    })

    return await tx.membership.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: DEFAULT_OWNER_ROLE,
      },
      include: {
        organization: true,
      },
    })
  })
}

export async function addOrganizationMember(
  organizationId: string,
  userId: string,
  role: OrganizationRole = DEFAULT_ORG_ROLE
): Promise<Membership> {
  return await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    create: {
      organizationId,
      userId,
      role,
    },
    update: {
      role,
    },
  })
}

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  return memberships.map((membership) => membership.organization)
}

export async function getFirstMembershipByUserId(userId: string) {
  return await prisma.membership.findFirst({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })
}

export async function ensurePrimaryMembership(user: User) {
  const existing = await getFirstMembershipByUserId(user.id)
  if (existing) {
    return existing
  }

  return await createOrganizationForUser(user)
}

export async function getMembershipByOrganizationSlug(userId: string, organizationSlug: string) {
  return await prisma.membership.findFirst({
    where: {
      userId,
      organization: {
        slug: organizationSlug,
      },
    },
    include: {
      organization: true,
    },
  })
}

export async function userHasOrganizationRole(
  userId: string,
  organizationId: string,
  acceptedRoles: OrganizationRole[]
): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    select: {
      role: true,
    },
  })

  if (!membership) {
    return false
  }

  return acceptedRoles.includes(membership.role as OrganizationRole)
}
