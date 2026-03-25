import { calculateAge } from './utils'

export interface ParticipantProfileForCsv {
  id?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  gender?: string | null
  birth_date?: string | null
  birthdate?: string | null
  location?: string | null
  nationality?: string | null
  residency_country?: string | null
  citizenships?: string[] | null
  languages?: Array<{ language: string; level: string }> | null
  participant_target_groups?: string[] | null
  has_fewer_opportunities?: boolean | null
  fewer_opportunities_categories?: string[] | null
  role_in_project?: string | null
  bio?: string | null
  website?: string | null
}

export interface ParticipantCsvMeta {
  eventTitle?: string | null
  eventId?: string | null
  participantId?: string | null
  applicationStatus?: string | null
  applicationDate?: string | null
  motivationLetter?: string | null
  email?: string | null
}

export const PARTICIPANT_CSV_HEADERS = [
  'Event Title',
  'Event ID',
  'Participant ID',
  'First Name',
  'Last Name',
  'Email',
  'Gender',
  'Birth Date',
  'Age',
  'Nationality',
  'Residency Country',
  'Location',
  'Citizenships',
  'Languages',
  'Target Groups',
  'Has Fewer Opportunities',
  'Fewer Opportunities Categories',
  'Role in Project',
  'Bio',
  'Website',
  'Motivation Letter',
  'Application Date',
  'Application Status'
] as const

const formatArrayField = (value: unknown): string => {
  if (!value) return ''
  if (Array.isArray(value)) {
    return value.join('; ')
  }
  return String(value)
}

const formatLanguagesField = (languages: Array<{ language: string; level: string }> | null | undefined): string => {
  if (!languages || !Array.isArray(languages) || languages.length === 0) return ''
  return languages
    .map((lang) => `${lang.language}${lang.level ? ` (${lang.level})` : ''}`)
    .join('; ')
}

const escapeCsvValue = (value: unknown): string => {
  const stringValue = value === null || value === undefined ? '' : String(value)
  if (
    stringValue.includes('"') ||
    stringValue.includes(',') ||
    stringValue.includes(';') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export const participantToCsvRow = (
  profile: ParticipantProfileForCsv | null | undefined,
  meta: ParticipantCsvMeta = {}
): string[] => {
  const birthDate = profile?.birth_date || profile?.birthdate || null
  const age = birthDate ? calculateAge(birthDate) : ''

  return [
    meta.eventTitle || '',
    meta.eventId || '',
    meta.participantId || profile?.id || '',
    profile?.first_name || '',
    profile?.last_name || '',
    profile?.email || meta.email || '',
    profile?.gender || '',
    birthDate || '',
    age ? String(age) : '',
    profile?.nationality || '',
    profile?.residency_country || '',
    profile?.location || '',
    formatArrayField(profile?.citizenships),
    formatLanguagesField(profile?.languages),
    formatArrayField(profile?.participant_target_groups),
    profile?.has_fewer_opportunities === null || profile?.has_fewer_opportunities === undefined
      ? ''
      : profile?.has_fewer_opportunities
      ? 'Yes'
      : 'No',
    formatArrayField(profile?.fewer_opportunities_categories),
    profile?.role_in_project || '',
    profile?.bio || '',
    profile?.website || '',
    meta.motivationLetter || '',
    meta.applicationDate || '',
    meta.applicationStatus || ''
  ]
}

export const downloadCsvFile = (filename: string, headers: readonly string[], rows: string[][]) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

