export const PARTICIPANT_COMPLETION_FIELDS = [
  'first_name',
  'last_name',
  'birth_date',
  'location',
  'gender',
  'nationality',
  'citizenships',
  'residency_country',
  'role_in_project',
  'languages',
  'participant_target_groups',
  'bio'
] as const

export const ORGANIZATION_COMPLETION_FIELDS = ['organization_name', 'location', 'bio'] as const

const COMPLETION_FIELD_LABELS: Record<string, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  birth_date: 'Birth Date',
  location: 'Location',
  gender: 'Gender',
  nationality: 'Nationality',
  citizenships: 'Citizenships',
  residency_country: 'Residency Country',
  role_in_project: 'Role in Project',
  languages: 'Languages',
  participant_target_groups: 'Target Groups',
  bio: 'Bio',
  organization_name: 'Organization Name'
}

export const formatCompletionFieldLabel = (field: string) => {
  if (COMPLETION_FIELD_LABELS[field]) return COMPLETION_FIELD_LABELS[field]
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const calculateProfileCompletion = (
  profile: Record<string, any>,
  userType: 'participant' | 'organization'
) => {
  const fields =
    userType === 'participant'
      ? [...PARTICIPANT_COMPLETION_FIELDS]
      : [...ORGANIZATION_COMPLETION_FIELDS]

  const fieldFilled = (field: string) => {
    const value = profile?.[field]
    if (Array.isArray(value)) {
      return value.length > 0
    }
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    return true
  }

  const filled = fields.filter(fieldFilled)
  const total = fields.length
  const percent = total === 0 ? 100 : Math.round((filled.length / total) * 100)
  const missingFields = fields.filter(field => !fieldFilled(field))
  const missing = missingFields.map(formatCompletionFieldLabel)

  return { percent, missing }
}

