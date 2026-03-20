export type Gender = 'male' | 'female'

export type RelationType =
  | 'father'
  | 'mother'
  | 'son'
  | 'daughter'
  | 'brother'
  | 'sister'
  | 'husband'
  | 'wife'
  | 'paternal_grandfather'
  | 'paternal_grandmother'
  | 'maternal_grandfather'
  | 'maternal_grandmother'
  | 'paternal_uncle'
  | 'paternal_aunt'
  | 'maternal_uncle'
  | 'maternal_aunt'
  | 'nephew_from_brother'
  | 'niece_from_brother'
  | 'nephew_from_sister'
  | 'niece_from_sister'
  | 'son_in_law'
  | 'daughter_in_law'
  | 'father_in_law'
  | 'mother_in_law'
  | 'step_father'
  | 'step_mother'
  | 'step_son'
  | 'step_daughter'
  | 'foster_mother'
  | 'foster_father'
  | 'foster_brother'
  | 'foster_sister'
  | 'foster_son'
  | 'foster_daughter'
  | 'foster_paternal_uncle'
  | 'foster_paternal_aunt'
  | 'foster_maternal_uncle'
  | 'foster_maternal_aunt'
  | 'foster_nephew_from_brother'
  | 'foster_niece_from_brother'
  | 'foster_nephew_from_sister'
  | 'foster_niece_from_sister'
  | 'foster_paternal_grandfather'
  | 'foster_paternal_grandmother'
  | 'foster_maternal_grandfather'
  | 'foster_maternal_grandmother'
  // ---> NEW FOSTER GRANDPARENTS MARRIAGE RELATIONS <---
  | 'wife_foster_paternal_grandfather'
  | 'wife_foster_paternal_grandmother'
  | 'wife_foster_maternal_grandfather'
  | 'wife_foster_maternal_grandmother'
  | 'husband_foster_paternal_grandfather'
  | 'husband_foster_paternal_grandmother'
  | 'husband_foster_maternal_grandfather'
  | 'husband_foster_maternal_grandmother'
  // ---> NEW FOSTER MARRIAGE RELATIONS <---
  | 'wife_foster_father'
  | 'wife_foster_mother'
  | 'wife_foster_daughter'
  | 'foster_father_wife'
  | 'foster_son_wife'
  | 'husband_foster_father'
  | 'husband_foster_mother'
  | 'husband_foster_son'
  | 'foster_mother_husband'
  | 'foster_daughter_husband'
  | 'wife_foster_sister'
  | 'wife_foster_paternal_aunt'
  | 'wife_foster_maternal_aunt'
  | 'wife_foster_niece_from_brother'
  | 'wife_foster_niece_from_sister'
  | 'foster_brother_wife'
  | 'foster_paternal_uncle_wife'
  | 'foster_maternal_uncle_wife'
  | 'foster_nephew_from_brother_wife'
  | 'foster_nephew_from_sister_wife'
  | 'husband_foster_brother'
  | 'husband_foster_paternal_uncle'
  | 'husband_foster_maternal_uncle'
  | 'husband_foster_nephew_from_brother'
  | 'husband_foster_nephew_from_sister'
  | 'foster_sister_husband'
  | 'foster_paternal_aunt_husband'
  | 'foster_maternal_aunt_husband'
  | 'foster_niece_from_brother_husband'
  | 'foster_niece_from_sister_husband'
  // ---> END FOSTER MARRIAGE RELATIONS <---
  | 'wife_sister'
  | 'wife_brother'
  | 'wife_paternal_aunt'
  | 'wife_maternal_aunt'
  | 'wife_paternal_grandfather'
  | 'wife_paternal_grandmother'
  | 'wife_maternal_grandfather'
  | 'wife_maternal_grandmother'
  | 'wife_niece_from_brother'
  | 'wife_niece_from_sister'
  | 'husband_brother'
  | 'husband_sister'
  | 'husband_paternal_uncle'
  | 'husband_maternal_uncle'
  | 'husband_paternal_grandfather'
  | 'husband_paternal_grandmother'
  | 'husband_maternal_grandfather'
  | 'husband_maternal_grandmother'
  | 'husband_nephew_from_brother'
  | 'husband_nephew_from_sister'
  | 'brother_wife'
  | 'paternal_uncle_wife'
  | 'maternal_uncle_wife'
  | 'nephew_wife'
  | 'niece_husband'
  | 'sister_husband'
  | 'paternal_aunt_husband'
  | 'maternal_aunt_husband'

export function isFosterRelation(type: RelationType): boolean {
  return type.includes('foster')
}

export type MahramCategory =
  | 'mahram_nasab'
  | 'mahram_susuan'
  | 'mahram_pernikahan'
  | 'mahram_sementara'
  | 'bukan_mahram'

export interface MahramResult {
  isMahram: boolean
  category: MahramCategory
  label: string
  reason: string
  condition?: string
}

export interface PersonNode {
  id: string
  name: string
  gender: Gender
  relationType: RelationType
  relationLabel?: string // Descriptive label computed from tree path (overrides RELATION_OPTIONS labelId)
  avatarSeed?: string // Custom seed for DiceBear avatar; defaults to name-relationType
  x: number
  y: number
  layer: number
}

export interface RelationEdge {
  id: string
  fromId: string
  toId: string
  relationType: RelationType
  mahramResult: MahramResult
  edgeKind?: 'parent' | 'child' | 'spouse'
}

export interface RelationOption {
  type: RelationType
  label: string
  labelId: string
  gender: Gender
  direction: 'up' | 'down' | 'side'
  parentRelation?: RelationType
  layer: number
}

export const RELATION_OPTIONS: RelationOption[] = [
  // Up (parents, grandparents) — layer -1 = parents, -2 = grandparents
  { type: 'father', label: 'Father', labelId: 'Bapak', gender: 'male', direction: 'up', layer: -1 },
  { type: 'mother', label: 'Mother', labelId: 'Ibu', gender: 'female', direction: 'up', layer: -1 },
  { type: 'paternal_grandfather', label: 'Paternal Grandfather', labelId: 'Kakek (dari bapak)', gender: 'male', direction: 'up', parentRelation: 'father', layer: -2 },
  { type: 'paternal_grandmother', label: 'Paternal Grandmother', labelId: 'Nenek (dari bapak)', gender: 'female', direction: 'up', parentRelation: 'paternal_grandfather', layer: -2 },
  { type: 'maternal_grandfather', label: 'Maternal Grandfather', labelId: 'Kakek (dari ibu)', gender: 'male', direction: 'up', parentRelation: 'mother', layer: -2 },
  { type: 'maternal_grandmother', label: 'Maternal Grandmother', labelId: 'Nenek (dari ibu)', gender: 'female', direction: 'up', parentRelation: 'maternal_grandfather', layer: -2 },
  { type: 'step_father', label: 'Step Father', labelId: 'Bapak Tiri', gender: 'male', direction: 'up', parentRelation: 'mother', layer: -1 },
  { type: 'step_mother', label: 'Step Mother', labelId: 'Ibu Tiri', gender: 'female', direction: 'up', parentRelation: 'father', layer: -1 },
  { type: 'father_in_law', label: 'Father in Law', labelId: 'Bapak Mertua', gender: 'male', direction: 'up', layer: -1 },
  { type: 'mother_in_law', label: 'Mother in Law', labelId: 'Ibu Mertua', gender: 'female', direction: 'up', parentRelation: 'father_in_law', layer: -1 },
  { type: 'foster_father', label: 'Foster Father (Susuan)', labelId: 'Bapak Susuan', gender: 'male', direction: 'up', layer: -1 },
  { type: 'foster_mother', label: 'Foster Mother (Susuan)', labelId: 'Ibu Susuan', gender: 'female', direction: 'up', layer: -1 },
  { type: 'foster_paternal_grandfather', label: 'Foster Paternal Grandfather', labelId: 'Kakek Susuan (dari bapak)', gender: 'male', direction: 'up', parentRelation: 'foster_father', layer: -2 },
  { type: 'foster_paternal_grandmother', label: 'Foster Paternal Grandmother', labelId: 'Nenek Susuan (dari bapak)', gender: 'female', direction: 'up', parentRelation: 'foster_paternal_grandfather', layer: -2 },
  { type: 'foster_maternal_grandfather', label: 'Foster Maternal Grandfather', labelId: 'Kakek Susuan (dari ibu)', gender: 'male', direction: 'up', parentRelation: 'foster_mother', layer: -2 },
  { type: 'foster_maternal_grandmother', label: 'Foster Maternal Grandmother', labelId: 'Nenek Susuan (dari ibu)', gender: 'female', direction: 'up', parentRelation: 'foster_maternal_grandfather', layer: -2 },

  // Side (siblings, spouse, uncle, aunt)
  { type: 'brother', label: 'Brother', labelId: 'Saudara Laki-laki', gender: 'male', direction: 'side', parentRelation: 'father', layer: 0 },
  { type: 'sister', label: 'Sister', labelId: 'Saudara Perempuan', gender: 'female', direction: 'side', parentRelation: 'father', layer: 0 },
  { type: 'husband', label: 'Husband', labelId: 'Suami', gender: 'male', direction: 'side', layer: 0 },
  { type: 'wife', label: 'Wife', labelId: 'Istri', gender: 'female', direction: 'side', layer: 0 },
  { type: 'paternal_uncle', label: 'Paternal Uncle', labelId: 'Paman (dari bapak)', gender: 'male', direction: 'side', parentRelation: 'paternal_grandfather', layer: -1 },
  { type: 'paternal_aunt', label: 'Paternal Aunt', labelId: 'Bibi (dari bapak)', gender: 'female', direction: 'side', parentRelation: 'paternal_grandfather', layer: -1 },
  { type: 'maternal_uncle', label: 'Maternal Uncle', labelId: 'Paman (dari ibu)', gender: 'male', direction: 'side', parentRelation: 'maternal_grandfather', layer: -1 },
  { type: 'maternal_aunt', label: 'Maternal Aunt', labelId: 'Bibi (dari ibu)', gender: 'female', direction: 'side', parentRelation: 'maternal_grandfather', layer: -1 },
  { type: 'foster_brother', label: 'Foster Brother', labelId: 'Saudara Susuan (lk)', gender: 'male', direction: 'side', parentRelation: 'foster_father', layer: 0 },
  { type: 'foster_sister', label: 'Foster Sister', labelId: 'Saudara Susuan (pr)', gender: 'female', direction: 'side', parentRelation: 'foster_father', layer: 0 },
  { type: 'foster_paternal_uncle', label: 'Foster Paternal Uncle', labelId: 'Paman Susuan (dari bapak)', gender: 'male', direction: 'side', parentRelation: 'foster_paternal_grandfather', layer: -1 },
  { type: 'foster_paternal_aunt', label: 'Foster Paternal Aunt', labelId: 'Bibi Susuan (dari bapak)', gender: 'female', direction: 'side', parentRelation: 'foster_paternal_grandfather', layer: -1 },
  { type: 'foster_maternal_uncle', label: 'Foster Maternal Uncle', labelId: 'Paman Susuan (dari ibu)', gender: 'male', direction: 'side', parentRelation: 'foster_maternal_grandfather', layer: -1 },
  { type: 'foster_maternal_aunt', label: 'Foster Maternal Aunt', labelId: 'Bibi Susuan (dari ibu)', gender: 'female', direction: 'side', parentRelation: 'foster_maternal_grandfather', layer: -1 },
  { type: 'wife_sister', label: "Wife's Sister", labelId: 'Saudara Perempuan Istri', gender: 'female', direction: 'side', parentRelation: 'father_in_law', layer: 0 },
  { type: 'wife_brother', label: "Wife's Brother", labelId: 'Saudara Laki-laki Istri', gender: 'male', direction: 'side', parentRelation: 'father_in_law', layer: 0 },
  { type: 'husband_sister', label: "Husband's Sister", labelId: 'Saudara Perempuan Suami', gender: 'female', direction: 'side', parentRelation: 'father_in_law', layer: 0 },
  { type: 'wife_paternal_aunt', label: "Wife's Paternal Aunt", labelId: 'Bibi Istri (dari bapak)', gender: 'female', direction: 'side', parentRelation: 'wife', layer: -1 },
  { type: 'wife_maternal_aunt', label: "Wife's Maternal Aunt", labelId: 'Bibi Istri (dari ibu)', gender: 'female', direction: 'side', parentRelation: 'wife', layer: -1 },
  { type: 'husband_brother', label: "Husband's Brother", labelId: 'Saudara Laki-laki Suami', gender: 'male', direction: 'side', parentRelation: 'father_in_law', layer: 0 },
  { type: 'husband_paternal_uncle', label: "Husband's Paternal Uncle", labelId: 'Paman Suami (dari bapak)', gender: 'male', direction: 'side', parentRelation: 'husband', layer: -1 },
  { type: 'husband_maternal_uncle', label: "Husband's Maternal Uncle", labelId: 'Paman Suami (dari ibu)', gender: 'male', direction: 'side', parentRelation: 'husband', layer: -1 },
  { type: 'wife_paternal_grandfather', label: "Wife's Paternal Grandfather", labelId: 'Kakek Istri (dari bapak)', gender: 'male', direction: 'up', parentRelation: 'father_in_law', layer: -2 },
  { type: 'wife_paternal_grandmother', label: "Wife's Paternal Grandmother", labelId: 'Nenek Istri (dari bapak)', gender: 'female', direction: 'up', parentRelation: 'wife_paternal_grandfather', layer: -2 },
  { type: 'wife_maternal_grandfather', label: "Wife's Maternal Grandfather", labelId: 'Kakek Istri (dari ibu)', gender: 'male', direction: 'up', parentRelation: 'mother_in_law', layer: -2 },
  { type: 'wife_maternal_grandmother', label: "Wife's Maternal Grandmother", labelId: 'Nenek Istri (dari ibu)', gender: 'female', direction: 'up', parentRelation: 'wife_maternal_grandfather', layer: -2 },
  { type: 'husband_paternal_grandfather', label: "Husband's Paternal Grandfather", labelId: 'Kakek Suami (dari bapak)', gender: 'male', direction: 'up', parentRelation: 'father_in_law', layer: -2 },
  { type: 'husband_paternal_grandmother', label: "Husband's Paternal Grandmother", labelId: 'Nenek Suami (dari bapak)', gender: 'female', direction: 'up', parentRelation: 'husband_paternal_grandfather', layer: -2 },
  { type: 'husband_maternal_grandfather', label: "Husband's Maternal Grandfather", labelId: 'Kakek Suami (dari ibu)', gender: 'male', direction: 'up', parentRelation: 'mother_in_law', layer: -2 },
  { type: 'husband_maternal_grandmother', label: "Husband's Maternal Grandmother", labelId: 'Nenek Suami (dari ibu)', gender: 'female', direction: 'up', parentRelation: 'husband_maternal_grandfather', layer: -2 },
  { type: 'brother_wife', label: "Brother's Wife", labelId: 'Istri Saudara Laki-laki', gender: 'female', direction: 'side', parentRelation: 'brother', layer: 0 },
  { type: 'sister_husband', label: "Sister's Husband", labelId: 'Suami Saudara Perempuan', gender: 'male', direction: 'side', parentRelation: 'sister', layer: 0 },
  { type: 'paternal_uncle_wife', label: "Paternal Uncle's Wife", labelId: 'Istri Paman (dari bapak)', gender: 'female', direction: 'side', parentRelation: 'paternal_uncle', layer: -1 },
  { type: 'maternal_uncle_wife', label: "Maternal Uncle's Wife", labelId: 'Istri Paman (dari ibu)', gender: 'female', direction: 'side', parentRelation: 'maternal_uncle', layer: -1 },
  { type: 'paternal_aunt_husband', label: "Paternal Aunt's Husband", labelId: 'Suami Bibi (dari bapak)', gender: 'male', direction: 'side', parentRelation: 'paternal_aunt', layer: -1 },
  { type: 'maternal_aunt_husband', label: "Maternal Aunt's Husband", labelId: 'Suami Bibi (dari ibu)', gender: 'male', direction: 'side', parentRelation: 'maternal_aunt', layer: -1 },

  // --- Foster Marriage Relations (Musaharah min ar-Rada'ah) ---
  { type: 'wife_foster_paternal_grandfather', label: "Wife's Foster Paternal Grandfather", labelId: 'Kakek Susuan Istri (Bapak)', gender: 'male', direction: 'up', parentRelation: 'wife_foster_father', layer: -2 },
  { type: 'wife_foster_paternal_grandmother', label: "Wife's Foster Paternal Grandmother", labelId: 'Nenek Susuan Istri (Bapak)', gender: 'female', direction: 'up', parentRelation: 'wife_foster_paternal_grandfather', layer: -2 },
  { type: 'wife_foster_maternal_grandfather', label: "Wife's Foster Maternal Grandfather", labelId: 'Kakek Susuan Istri (Ibu)', gender: 'male', direction: 'up', parentRelation: 'wife_foster_mother', layer: -2 },
  { type: 'wife_foster_maternal_grandmother', label: "Wife's Foster Maternal Grandmother", labelId: 'Nenek Susuan Istri (Ibu)', gender: 'female', direction: 'up', parentRelation: 'wife_foster_maternal_grandfather', layer: -2 },

  { type: 'wife_foster_father', label: "Wife's Foster Father", labelId: 'Bapak Susuan Istri', gender: 'male', direction: 'up', parentRelation: 'wife', layer: -1 },
  { type: 'wife_foster_mother', label: "Wife's Foster Mother", labelId: 'Ibu Susuan Istri', gender: 'female', direction: 'up', parentRelation: 'wife_foster_father', layer: -1 },
  { type: 'wife_foster_daughter', label: "Wife's Foster Daughter", labelId: 'Anak Pr Susuan Istri', gender: 'female', direction: 'down', parentRelation: 'wife', layer: 1 },
  { type: 'foster_father_wife', label: "Foster Father's Wife", labelId: 'Istri Bapak Susuan', gender: 'female', direction: 'side', parentRelation: 'foster_father', layer: -1 },
  { type: 'foster_son_wife', label: "Foster Son's Wife", labelId: 'Istri Anak Lk Susuan', gender: 'female', direction: 'side', parentRelation: 'foster_son', layer: 1 },

  { type: 'husband_foster_paternal_grandfather', label: "Husband's Foster Paternal Grandfather", labelId: 'Kakek Susuan Suami (Bapak)', gender: 'male', direction: 'up', parentRelation: 'husband_foster_father', layer: -2 },
  { type: 'husband_foster_paternal_grandmother', label: "Husband's Foster Paternal Grandmother", labelId: 'Nenek Susuan Suami (Bapak)', gender: 'female', direction: 'up', parentRelation: 'husband_foster_paternal_grandfather', layer: -2 },
  { type: 'husband_foster_maternal_grandfather', label: "Husband's Foster Maternal Grandfather", labelId: 'Kakek Susuan Suami (Ibu)', gender: 'male', direction: 'up', parentRelation: 'husband_foster_mother', layer: -2 },
  { type: 'husband_foster_maternal_grandmother', label: "Husband's Foster Maternal Grandmother", labelId: 'Nenek Susuan Suami (Ibu)', gender: 'female', direction: 'up', parentRelation: 'husband_foster_maternal_grandfather', layer: -2 },

  { type: 'husband_foster_father', label: "Husband's Foster Father", labelId: 'Bapak Susuan Suami', gender: 'male', direction: 'up', parentRelation: 'husband', layer: -1 },
  { type: 'husband_foster_mother', label: "Husband's Foster Mother", labelId: 'Ibu Susuan Suami', gender: 'female', direction: 'up', parentRelation: 'husband_foster_father', layer: -1 },
  { type: 'husband_foster_son', label: "Husband's Foster Son", labelId: 'Anak Lk Susuan Suami', gender: 'male', direction: 'down', parentRelation: 'husband', layer: 1 },
  { type: 'foster_mother_husband', label: "Foster Mother's Husband", labelId: 'Suami Ibu Susuan', gender: 'male', direction: 'side', parentRelation: 'foster_mother', layer: -1 },
  { type: 'foster_daughter_husband', label: "Foster Daughter's Husband", labelId: 'Suami Anak Pr Susuan', gender: 'male', direction: 'side', parentRelation: 'foster_daughter', layer: 1 },

  { type: 'wife_foster_sister', label: "Wife's Foster Sister", labelId: 'Saudara Pr Susuan Istri', gender: 'female', direction: 'side', parentRelation: 'wife_foster_father', layer: 0 },
  { type: 'wife_foster_paternal_aunt', label: "Wife's Foster Paternal Aunt", labelId: 'Bibi Susuan Istri (Bapak)', gender: 'female', direction: 'side', parentRelation: 'wife_foster_paternal_grandfather', layer: -1 },
  { type: 'wife_foster_maternal_aunt', label: "Wife's Foster Maternal Aunt", labelId: 'Bibi Susuan Istri (Ibu)', gender: 'female', direction: 'side', parentRelation: 'wife_foster_maternal_grandfather', layer: -1 },
  { type: 'wife_foster_niece_from_brother', label: "Wife's Foster Niece (from Brother)", labelId: 'Keponakan Pr Susuan Istri (Sdr Lk)', gender: 'female', direction: 'down', parentRelation: 'wife', layer: 1 },
  { type: 'wife_foster_niece_from_sister', label: "Wife's Foster Niece (from Sister)", labelId: 'Keponakan Pr Susuan Istri (Sdr Pr)', gender: 'female', direction: 'down', parentRelation: 'wife', layer: 1 },
  
  { type: 'foster_brother_wife', label: "Foster Brother's Wife", labelId: 'Istri Sdr Lk Susuan', gender: 'female', direction: 'side', parentRelation: 'foster_brother', layer: 0 },
  { type: 'foster_paternal_uncle_wife', label: "Foster Paternal Uncle's Wife", labelId: 'Istri Paman Susuan (Bapak)', gender: 'female', direction: 'side', parentRelation: 'foster_paternal_uncle', layer: -1 },
  { type: 'foster_maternal_uncle_wife', label: "Foster Maternal Uncle's Wife", labelId: 'Istri Paman Susuan (Ibu)', gender: 'female', direction: 'side', parentRelation: 'foster_maternal_uncle', layer: -1 },
  { type: 'foster_nephew_from_brother_wife', label: "Foster Nephew (from brother)'s Wife", labelId: 'Istri Keponakan Lk Susuan (Sdr Lk)', gender: 'female', direction: 'side', parentRelation: 'foster_nephew_from_brother', layer: 1 },
  { type: 'foster_nephew_from_sister_wife', label: "Foster Nephew (from sister)'s Wife", labelId: 'Istri Keponakan Lk Susuan (Sdr Pr)', gender: 'female', direction: 'side', parentRelation: 'foster_nephew_from_sister', layer: 1 },

  { type: 'husband_foster_brother', label: "Husband's Foster Brother", labelId: 'Saudara Lk Susuan Suami', gender: 'male', direction: 'side', parentRelation: 'husband_foster_father', layer: 0 },
  { type: 'husband_foster_paternal_uncle', label: "Husband's Foster Paternal Uncle", labelId: 'Paman Susuan Suami (Bapak)', gender: 'male', direction: 'side', parentRelation: 'husband_foster_paternal_grandfather', layer: -1 },
  { type: 'husband_foster_maternal_uncle', label: "Husband's Foster Maternal Uncle", labelId: 'Paman Susuan Suami (Ibu)', gender: 'male', direction: 'side', parentRelation: 'husband_foster_maternal_grandfather', layer: -1 },
  { type: 'husband_foster_nephew_from_brother', label: "Husband's Foster Nephew (from Brother)", labelId: 'Keponakan Lk Susuan Suami (Sdr Lk)', gender: 'male', direction: 'down', parentRelation: 'husband', layer: 1 },
  { type: 'husband_foster_nephew_from_sister', label: "Husband's Foster Nephew (from Sister)", labelId: 'Keponakan Lk Susuan Suami (Sdr Pr)', gender: 'male', direction: 'down', parentRelation: 'husband', layer: 1 },
  
  { type: 'foster_sister_husband', label: "Foster Sister's Husband", labelId: 'Suami Sdr Pr Susuan', gender: 'male', direction: 'side', parentRelation: 'foster_sister', layer: 0 },
  { type: 'foster_paternal_aunt_husband', label: "Foster Paternal Aunt's Husband", labelId: 'Suami Bibi Susuan (Bapak)', gender: 'male', direction: 'side', parentRelation: 'foster_paternal_aunt', layer: -1 },
  { type: 'foster_maternal_aunt_husband', label: "Foster Maternal Aunt's Husband", labelId: 'Suami Bibi Susuan (Ibu)', gender: 'male', direction: 'side', parentRelation: 'foster_maternal_aunt', layer: -1 },
  { type: 'foster_niece_from_brother_husband', label: "Foster Niece (from Brother)'s Husband", labelId: 'Suami Keponakan Pr Susuan (Sdr Lk)', gender: 'male', direction: 'side', parentRelation: 'foster_niece_from_brother', layer: 1 },
  { type: 'foster_niece_from_sister_husband', label: "Foster Niece (from Sister)'s Husband", labelId: 'Suami Keponakan Pr Susuan (Sdr Pr)', gender: 'male', direction: 'side', parentRelation: 'foster_niece_from_sister', layer: 1 },

  // Down (children, nephews, nieces)
  { type: 'son', label: 'Son', labelId: 'Anak Laki-laki', gender: 'male', direction: 'down', layer: 1 },
  { type: 'daughter', label: 'Daughter', labelId: 'Anak Perempuan', gender: 'female', direction: 'down', layer: 1 },
  { type: 'step_son', label: 'Step Son', labelId: 'Anak Tiri (lk)', gender: 'male', direction: 'down', layer: 1 },
  { type: 'step_daughter', label: 'Step Daughter', labelId: 'Anak Tiri (pr)', gender: 'female', direction: 'down', layer: 1 },
  { type: 'nephew_from_brother', label: 'Nephew (from brother)', labelId: 'Keponakan Lk (dari sdr lk)', gender: 'male', direction: 'down', parentRelation: 'brother', layer: 1 },
  { type: 'niece_from_brother', label: 'Niece (from brother)', labelId: 'Keponakan Pr (dari sdr lk)', gender: 'female', direction: 'down', parentRelation: 'brother', layer: 1 },
  { type: 'nephew_from_sister', label: 'Nephew (from sister)', labelId: 'Keponakan Lk (dari sdr pr)', gender: 'male', direction: 'down', parentRelation: 'sister', layer: 1 },
  { type: 'niece_from_sister', label: 'Niece (from sister)', labelId: 'Keponakan Pr (dari sdr pr)', gender: 'female', direction: 'down', parentRelation: 'sister', layer: 1 },
  { type: 'son_in_law', label: 'Son in Law', labelId: 'Menantu Laki-laki', gender: 'male', direction: 'down', parentRelation: 'daughter', layer: 1 },
  { type: 'daughter_in_law', label: 'Daughter in Law', labelId: 'Menantu Perempuan', gender: 'female', direction: 'down', parentRelation: 'son', layer: 1 },
  { type: 'foster_son', label: 'Foster Son', labelId: 'Anak Susuan (lk)', gender: 'male', direction: 'down', layer: 1 },
  { type: 'foster_daughter', label: 'Foster Daughter', labelId: 'Anak Susuan (pr)', gender: 'female', direction: 'down', layer: 1 },
  { type: 'foster_nephew_from_brother', label: 'Foster Nephew (from brother)', labelId: 'Keponakan Susuan Lk (sdr lk)', gender: 'male', direction: 'down', parentRelation: 'foster_brother', layer: 1 },
  { type: 'foster_niece_from_brother', label: 'Foster Niece (from brother)', labelId: 'Keponakan Susuan Pr (sdr lk)', gender: 'female', direction: 'down', parentRelation: 'foster_brother', layer: 1 },
  { type: 'foster_nephew_from_sister', label: 'Foster Nephew (from sister)', labelId: 'Keponakan Susuan Lk (sdr pr)', gender: 'male', direction: 'down', parentRelation: 'foster_sister', layer: 1 },
  { type: 'foster_niece_from_sister', label: 'Foster Niece (from sister)', labelId: 'Keponakan Susuan Pr (sdr pr)', gender: 'female', direction: 'down', parentRelation: 'foster_sister', layer: 1 },
  { type: 'wife_niece_from_brother', label: "Wife's Niece (from brother)", labelId: 'Keponakan Pr Istri (sdr lk)', gender: 'female', direction: 'down', parentRelation: 'wife', layer: 1 },
  { type: 'wife_niece_from_sister', label: "Wife's Niece (from sister)", labelId: 'Keponakan Pr Istri (sdr pr)', gender: 'female', direction: 'down', parentRelation: 'wife', layer: 1 },
  { type: 'husband_nephew_from_brother', label: "Husband's Nephew (from brother)", labelId: 'Keponakan Lk Suami (sdr lk)', gender: 'male', direction: 'down', parentRelation: 'husband', layer: 1 },
  { type: 'husband_nephew_from_sister', label: "Husband's Nephew (from sister)", labelId: 'Keponakan Lk Suami (sdr pr)', gender: 'male', direction: 'down', parentRelation: 'husband', layer: 1 },
  { type: 'nephew_wife', label: "Nephew's Wife", labelId: 'Istri Keponakan', gender: 'female', direction: 'down', parentRelation: 'nephew_from_brother', layer: 1 },
  { type: 'niece_husband', label: "Niece's Husband", labelId: 'Suami Keponakan', gender: 'male', direction: 'down', parentRelation: 'niece_from_brother', layer: 1 },
]
