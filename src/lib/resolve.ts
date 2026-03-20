import type { Gender, RelationType } from './types'

export type BaseRelation = 'father' | 'mother' | 'son' | 'daughter' | 'brother' | 'sister' | 'husband' | 'wife'

export interface BaseRelationOption {
  type: BaseRelation
  label: string
  labelId: string
  gender: Gender
  direction: 'up' | 'down' | 'side'
}

export const BASE_RELATIONS: BaseRelationOption[] = [
  { type: 'father', label: 'Father', labelId: 'Bapak', gender: 'male', direction: 'up' },
  { type: 'mother', label: 'Mother', labelId: 'Ibu', gender: 'female', direction: 'up' },
  { type: 'son', label: 'Son', labelId: 'Anak Laki-laki', gender: 'male', direction: 'down' },
  { type: 'daughter', label: 'Daughter', labelId: 'Anak Perempuan', gender: 'female', direction: 'down' },
  { type: 'brother', label: 'Brother', labelId: 'Saudara Laki-laki', gender: 'male', direction: 'side' },
  { type: 'sister', label: 'Sister', labelId: 'Saudara Perempuan', gender: 'female', direction: 'side' },
  { type: 'husband', label: 'Husband', labelId: 'Suami', gender: 'male', direction: 'side' },
  { type: 'wife', label: 'Wife', labelId: 'Istri', gender: 'female', direction: 'side' },
]

/**
 * Maps (parent's relation to user, base relation being added) → resolved relation to user.
 * If a combination isn't here, the relation can't be resolved to a known mahram type.
 */
const RESOLVE_MAP: Partial<Record<RelationType, Partial<Record<BaseRelation, RelationType>>>> = {
  // From father
  father: {
    father: 'paternal_grandfather',
    mother: 'paternal_grandmother',
    brother: 'paternal_uncle',
    sister: 'paternal_aunt',
    son: 'brother',
    daughter: 'sister',
    wife: 'mother',
  },
  // From mother
  mother: {
    father: 'maternal_grandfather',
    mother: 'maternal_grandmother',
    brother: 'maternal_uncle',
    sister: 'maternal_aunt',
    son: 'brother',
    daughter: 'sister',
    husband: 'father',
  },
  // From siblings
  brother: {
    son: 'nephew_from_brother',
    daughter: 'niece_from_brother',
    wife: 'brother_wife',
  },
  sister: {
    son: 'nephew_from_sister',
    daughter: 'niece_from_sister',
    husband: 'sister_husband',
  },
  // From children
  son: {
    wife: 'daughter_in_law',
  },
  daughter: {
    husband: 'son_in_law',
  },
  // From spouse
  wife: {
    father: 'father_in_law',
    mother: 'mother_in_law',
    sister: 'wife_sister',
    son: 'step_son',
    daughter: 'step_daughter',
  },
  husband: {
    father: 'father_in_law',
    mother: 'mother_in_law',
    brother: 'husband_brother',
    son: 'step_son',
    daughter: 'step_daughter',
  },
  // From grandparents
  paternal_grandfather: {
    son: 'paternal_uncle',
    daughter: 'paternal_aunt',
    wife: 'paternal_grandmother',
  },
  paternal_grandmother: {
    son: 'paternal_uncle',
    daughter: 'paternal_aunt',
    husband: 'paternal_grandfather',
  },
  maternal_grandfather: {
    son: 'maternal_uncle',
    daughter: 'maternal_aunt',
    wife: 'maternal_grandmother',
  },
  maternal_grandmother: {
    son: 'maternal_uncle',
    daughter: 'maternal_aunt',
    husband: 'maternal_grandfather',
  },
  // From uncles/aunts
  paternal_uncle: {
    wife: 'paternal_uncle_wife',
  },
  maternal_uncle: {
    wife: 'maternal_uncle_wife',
  },
  paternal_aunt: {
    husband: 'paternal_aunt_husband',
  },
  maternal_aunt: {
    husband: 'maternal_aunt_husband',
  },
  // From nephews/nieces
  nephew_from_brother: {
    wife: 'nephew_wife',
  },
  niece_from_brother: {
    husband: 'niece_husband',
  },
  // From step parents
  step_father: {
    son: 'brother',
    daughter: 'sister',
  },
  step_mother: {
    son: 'brother',
    daughter: 'sister',
  },
  // From foster relations
  foster_mother: {
    son: 'foster_brother',
    daughter: 'foster_sister',
    husband: 'foster_father', // Husband of foster mother IS the foster father (bapak susuan)
    brother: 'foster_maternal_uncle',
    sister: 'foster_maternal_aunt',
    father: 'foster_maternal_grandfather',
    mother: 'foster_maternal_grandmother',
  },
  foster_father: {
    son: 'foster_brother',
    daughter: 'foster_sister',
    wife: 'foster_mother', // Wife of foster father IS the foster mother (ibu susuan)
    brother: 'foster_paternal_uncle',
    sister: 'foster_paternal_aunt',
    father: 'foster_paternal_grandfather',
    mother: 'foster_paternal_grandmother',
  },
  foster_paternal_grandfather: {
    son: 'foster_paternal_uncle',
    daughter: 'foster_paternal_aunt',
    wife: 'foster_paternal_grandmother',
  },
  foster_paternal_grandmother: {
    son: 'foster_paternal_uncle',
    daughter: 'foster_paternal_aunt',
    husband: 'foster_paternal_grandfather',
  },
  foster_maternal_grandfather: {
    son: 'foster_maternal_uncle',
    daughter: 'foster_maternal_aunt',
    wife: 'foster_maternal_grandmother',
  },
  foster_maternal_grandmother: {
    son: 'foster_maternal_uncle',
    daughter: 'foster_maternal_aunt',
    husband: 'foster_maternal_grandfather',
  },
  foster_brother: {
    son: 'foster_nephew_from_brother',
    daughter: 'foster_niece_from_brother',
    wife: 'foster_brother_wife',
  },
  foster_sister: {
    son: 'foster_nephew_from_sister',
    daughter: 'foster_niece_from_sister',
    husband: 'foster_sister_husband',
  },
  foster_paternal_uncle: {
    wife: 'foster_paternal_uncle_wife',
  },
  foster_maternal_uncle: {
    wife: 'foster_maternal_uncle_wife',
  },
  foster_mother_husband: {
    son: 'foster_brother',
    daughter: 'foster_sister',
    brother: 'foster_paternal_uncle',
    sister: 'foster_paternal_aunt',
    father: 'foster_paternal_grandfather',
    mother: 'foster_paternal_grandmother',
  },
  foster_father_wife: {
    son: 'foster_brother',
    daughter: 'foster_sister',
    brother: 'foster_maternal_uncle',
    sister: 'foster_maternal_aunt',
    father: 'foster_maternal_grandfather',
    mother: 'foster_maternal_grandmother',
  },
  foster_paternal_aunt: {
    husband: 'foster_paternal_aunt_husband',
  },
  foster_maternal_aunt: {
    husband: 'foster_maternal_aunt_husband',
  },
  foster_nephew_from_brother: {
    wife: 'foster_nephew_from_brother_wife',
  },
  foster_niece_from_brother: {
    husband: 'foster_niece_from_brother_husband',
  },
  foster_nephew_from_sister: {
    wife: 'foster_nephew_from_sister_wife',
  },
  foster_niece_from_sister: {
    husband: 'foster_niece_from_sister_husband',
  },
  wife_foster_mother: {
    husband: 'wife_foster_father',
  },
  wife_foster_father: {
    wife: 'wife_foster_mother',
  },
  husband_foster_father: {
    wife: 'husband_foster_mother',
  },
  husband_foster_mother: {
    husband: 'husband_foster_father',
  },
  wife_foster_paternal_grandfather: {
    wife: 'wife_foster_paternal_grandmother',
  },
  wife_foster_paternal_grandmother: {
    husband: 'wife_foster_paternal_grandfather',
  },
  wife_foster_maternal_grandfather: {
    wife: 'wife_foster_maternal_grandmother',
  },
  wife_foster_maternal_grandmother: {
    husband: 'wife_foster_maternal_grandfather',
  },
  husband_foster_paternal_grandfather: {
    wife: 'husband_foster_paternal_grandmother',
  },
  husband_foster_paternal_grandmother: {
    husband: 'husband_foster_paternal_grandfather',
  },
  husband_foster_maternal_grandfather: {
    wife: 'husband_foster_maternal_grandmother',
  },
  husband_foster_maternal_grandmother: {
    husband: 'husband_foster_maternal_grandfather',
  },
  // From in-law parents — gender-conditional entries handled in resolveRelation()
  father_in_law: {
    wife: 'mother_in_law',
  },
  mother_in_law: {
    husband: 'father_in_law',
  },
  // Spouse and children mappings for in-law siblings
  husband_brother: {
    wife: 'brother_wife',
    son: 'husband_nephew_from_brother',
  },
  wife_brother: {
    wife: 'brother_wife',
    daughter: 'wife_niece_from_brother',
  },
  wife_sister: {
    husband: 'sister_husband',
    daughter: 'wife_niece_from_sister',
  },
  husband_sister: {
    husband: 'sister_husband',
    son: 'husband_nephew_from_sister',
  },
  // In-law grandparents — spouse + ancestor/sibling mappings
  // Ancestors beyond grandparents reuse grandparent types (same mahram category)
  // Siblings map to aunt types (same mahram category — haram dimadu / sementara)
  wife_paternal_grandfather: {
    wife: 'wife_paternal_grandmother',
    father: 'wife_paternal_grandfather',
    mother: 'wife_paternal_grandmother',
    son: 'wife_paternal_grandfather',
    daughter: 'wife_paternal_grandmother',
    sister: 'wife_paternal_grandmother',
  },
  wife_paternal_grandmother: {
    husband: 'wife_paternal_grandfather',
    father: 'wife_paternal_grandfather',
    mother: 'wife_paternal_grandmother',
    son: 'wife_paternal_grandfather',
    daughter: 'wife_paternal_grandmother',
    sister: 'wife_paternal_grandmother',
  },
  wife_maternal_grandfather: {
    wife: 'wife_maternal_grandmother',
    father: 'wife_maternal_grandfather',
    mother: 'wife_maternal_grandmother',
    son: 'wife_maternal_grandfather',
    daughter: 'wife_maternal_grandmother',
    sister: 'wife_maternal_grandmother',
  },
  wife_maternal_grandmother: {
    husband: 'wife_maternal_grandfather',
    father: 'wife_maternal_grandfather',
    mother: 'wife_maternal_grandmother',
    son: 'wife_maternal_grandfather',
    daughter: 'wife_maternal_grandmother',
    sister: 'wife_maternal_grandmother',
  },
  husband_paternal_grandfather: {
    wife: 'husband_paternal_grandmother',
    father: 'husband_paternal_grandfather',
    mother: 'husband_paternal_grandmother',
    son: 'husband_paternal_grandfather',
    daughter: 'husband_paternal_grandmother',
    brother: 'husband_paternal_grandfather',
  },
  husband_paternal_grandmother: {
    husband: 'husband_paternal_grandfather',
    father: 'husband_paternal_grandfather',
    mother: 'husband_paternal_grandmother',
    son: 'husband_paternal_grandfather',
    daughter: 'husband_paternal_grandmother',
    brother: 'husband_paternal_grandfather',
  },
  husband_maternal_grandfather: {
    wife: 'husband_maternal_grandmother',
    father: 'husband_maternal_grandfather',
    mother: 'husband_maternal_grandmother',
    son: 'husband_maternal_grandfather',
    daughter: 'husband_maternal_grandmother',
    brother: 'husband_maternal_grandfather',
  },
  husband_maternal_grandmother: {
    husband: 'husband_maternal_grandfather',
    father: 'husband_maternal_grandfather',
    mother: 'husband_maternal_grandmother',
    son: 'husband_maternal_grandfather',
    daughter: 'husband_maternal_grandmother',
    brother: 'husband_maternal_grandfather',
  },
}

/**
 * Returns true if childType is the result of adding 'wife' or 'husband' to a parentType node.
 * Used to identify spouse edges regardless of their resolved relation type.
 */
export function isSpouseResolution(parentType: RelationType, childType: RelationType, _userGender?: Gender): boolean {
  const map = RESOLVE_MAP[parentType]
  if (!map) return false
  return map['wife'] === childType || map['husband'] === childType
}

/**
 * Gender-conditional mappings for in-law parents.
 * father_in_law/mother_in_law resolve relatives differently based on user gender.
 */
const FATHER_IN_LAW_GENDER_MAP: Record<Gender, Partial<Record<BaseRelation, RelationType>>> = {
  male: {
    son: 'wife_brother',
    daughter: 'wife_sister',
    father: 'wife_paternal_grandfather',
    mother: 'wife_paternal_grandmother',
  },
  female: {
    son: 'husband_brother',
    daughter: 'husband_sister',
    father: 'husband_paternal_grandfather',
    mother: 'husband_paternal_grandmother',
  },
}

const MOTHER_IN_LAW_GENDER_MAP: Record<Gender, Partial<Record<BaseRelation, RelationType>>> = {
  male: {
    son: 'wife_brother',
    daughter: 'wife_sister',
    father: 'wife_maternal_grandfather',
    mother: 'wife_maternal_grandmother',
  },
  female: {
    son: 'husband_brother',
    daughter: 'husband_sister',
    father: 'husband_maternal_grandfather',
    mother: 'husband_maternal_grandmother',
  },
}

/**
 * Resolve a base relation added to a parent node into the actual relation to the user.
 * Returns the resolved RelationType, or null if the combination isn't mapped.
 */
export function resolveRelation(
  parentRelationType: RelationType,
  baseRelation: BaseRelation,
  userGender?: Gender,
): RelationType | null {
  // Handle gender-conditional in-law mappings
  if (userGender) {
    if (parentRelationType === 'father_in_law') {
      const resolved = FATHER_IN_LAW_GENDER_MAP[userGender][baseRelation]
      if (resolved) return resolved
    }
    if (parentRelationType === 'mother_in_law') {
      const resolved = MOTHER_IN_LAW_GENDER_MAP[userGender][baseRelation]
      if (resolved) return resolved
    }
  }

  const map = RESOLVE_MAP[parentRelationType]
  if (!map) return null
  return map[baseRelation] ?? null
}

type FosterRelationType = 'foster_father' | 'foster_mother' | 'foster_son' | 'foster_daughter' | 'foster_brother' | 'foster_sister'

export function resolveFosterRelation(
  parentRelationType: RelationType | null,
  fosterType: FosterRelationType,
): RelationType {
  if (!parentRelationType) {
    return fosterType
  }

  const prefixMap: Record<string, string> = {
    wife: 'wife_foster_',
    husband: 'husband_foster_',
    father: 'paternal_',
    mother: 'maternal_',
    brother: 'foster_',
    sister: 'foster_',
    son: 'foster_',
    daughter: 'foster_',
    paternal_grandfather: 'foster_paternal_',
    paternal_grandmother: 'foster_paternal_',
    maternal_grandfather: 'foster_maternal_',
    maternal_grandmother: 'foster_maternal_',
    paternal_uncle: 'foster_paternal_',
    paternal_aunt: 'foster_paternal_',
    maternal_uncle: 'foster_maternal_',
    maternal_aunt: 'foster_maternal_',
    nephew_from_brother: 'foster_',
    nephew_from_sister: 'foster_',
    niece_from_brother: 'foster_',
    niece_from_sister: 'foster_',
    step_father: 'foster_',
    step_mother: 'foster_',
    step_son: 'foster_',
    step_daughter: 'foster_',
    father_in_law: 'wife_foster_',
    mother_in_law: 'wife_foster_',
  }

  const suffixMap: Record<FosterRelationType, string> = {
    foster_father: 'father',
    foster_mother: 'mother',
    foster_son: 'son',
    foster_daughter: 'daughter',
    foster_brother: 'brother',
    foster_sister: 'sister',
  }

  const prefix = prefixMap[parentRelationType] || ''
  const suffix = suffixMap[fosterType] || fosterType

  return (prefix + suffix) as RelationType
}
