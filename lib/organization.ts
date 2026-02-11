import { getCurrentUser } from "@/lib/auth"
import { headers } from "next/headers"
import { cache } from "react"
import { ensurePrimaryMembership, getMembershipByOrganizationSlug } from "@/models/organizations"

export const ORGANIZATION_HEADER = "x-organization-slug"

export const getCurrentMembership = cache(async () => {
  const user = await getCurrentUser()
  const headersList = await headers()
  const organizationSlug = headersList.get(ORGANIZATION_HEADER)

  if (organizationSlug) {
    const membershipBySlug = await getMembershipByOrganizationSlug(user.id, organizationSlug)
    if (membershipBySlug) {
      return membershipBySlug
    }
  }

  return await ensurePrimaryMembership(user)
})

export const getCurrentOrganizationId = cache(async () => {
  const membership = await getCurrentMembership()
  return membership.organizationId
})
