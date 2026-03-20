import type { Gender, RelationType, MahramResult } from './types'

export function checkMahram(userGender: Gender, relationType: RelationType): MahramResult {
  // ====== MAHRAM NASAB (by blood) ======
  // For males
  if (userGender === 'male') {
    const mahramNasabMale: RelationType[] = [
      'mother', 'daughter', 'sister',
      'paternal_aunt', 'maternal_aunt',
      'niece_from_brother', 'niece_from_sister',
      'paternal_grandmother', 'maternal_grandmother',
    ]
    if (mahramNasabMale.includes(relationType)) {
      return {
        isMahram: true,
        category: 'mahram_nasab',
        label: 'Mahram Nasab',
        reason: getMahramNasabReason(relationType),
      }
    }
  }

  // For females
  if (userGender === 'female') {
    const mahramNasabFemale: RelationType[] = [
      'father', 'son', 'brother',
      'paternal_uncle', 'maternal_uncle',
      'nephew_from_brother', 'nephew_from_sister',
      'paternal_grandfather', 'maternal_grandfather',
    ]
    if (mahramNasabFemale.includes(relationType)) {
      return {
        isMahram: true,
        category: 'mahram_nasab',
        label: 'Mahram Nasab',
        reason: getMahramNasabReason(relationType),
      }
    }
  }

  // ====== MAHRAM SUSUAN (by breastfeeding) ======
  const mahramSusuanMale: RelationType[] = [
    'foster_mother', 'foster_daughter', 'foster_sister',
    'foster_paternal_aunt', 'foster_maternal_aunt',
    'foster_niece_from_brother', 'foster_niece_from_sister',
    'foster_paternal_grandmother', 'foster_maternal_grandmother',
  ]
  const mahramSusuanFemale: RelationType[] = [
    'foster_father', 'foster_son', 'foster_brother',
    'foster_paternal_uncle', 'foster_maternal_uncle',
    'foster_nephew_from_brother', 'foster_nephew_from_sister',
    'foster_paternal_grandfather', 'foster_maternal_grandfather',
  ]

  if (userGender === 'male' && mahramSusuanMale.includes(relationType)) {
    return {
      isMahram: true,
      category: 'mahram_susuan',
      label: 'Mahram Sesusuan',
      reason: getMahramSusuanReason(relationType),
    }
  }
  if (userGender === 'female' && mahramSusuanFemale.includes(relationType)) {
    return {
      isMahram: true,
      category: 'mahram_susuan',
      label: 'Mahram Sesusuan',
      reason: getMahramSusuanReason(relationType),
    }
  }

  // ====== MAHRAM PERNIKAHAN (by marriage - permanent) ======
  // For males: mother-in-law (nikah saja), step_daughter (harus jima'), step_mother (nikah saja), daughter_in_law (nikah saja)
  if (userGender === 'male') {
    if (relationType === 'mother_in_law' || relationType === 'wife_foster_mother'
      || relationType === 'wife_paternal_grandmother' || relationType === 'wife_maternal_grandmother') {
      return {
        isMahram: true,
        category: 'mahram_pernikahan',
        label: 'Mahram Pernikahan',
        reason: getMahramPernikahanReason(relationType),
      }
    }
    if (relationType === 'step_daughter' || relationType === 'wife_foster_daughter') {
      return {
        isMahram: true,
        category: 'mahram_pernikahan',
        label: 'Mahram Pernikahan',
        reason: 'Anak tiri perempuan (atau anak perempuan susuan istri) - mahram selamanya, harus sudah dijima\' dengan istrinya',
        condition: 'Harus sudah dijima\' dengan istri',
      }
    }
    if (relationType === 'step_mother' || relationType === 'foster_father_wife') {
      return {
        isMahram: true,
        category: 'mahram_pernikahan',
        label: 'Mahram Pernikahan',
        reason: 'Ibu tiri (atau istri bapak susuan) - mahram selamanya, cukup dengan akad nikah',
      }
    }
    if (relationType === 'daughter_in_law' || relationType === 'foster_son_wife') {
      return {
        isMahram: true,
        category: 'mahram_pernikahan',
        label: 'Mahram Pernikahan',
        reason: 'Menantu perempuan (atau istri anak susuan) - mahram selamanya, cukup dengan akad nikah',
      }
    }
  }

  // For females: father-in-law (nikah saja), step_son (nikah saja), step_father (harus jima'), son_in_law (nikah saja)
  if (userGender === 'female') {
    if (relationType === 'father_in_law' || relationType === 'husband_foster_father'
      || relationType === 'husband_paternal_grandfather' || relationType === 'husband_maternal_grandfather') {
      return {
        isMahram: true,
        category: 'mahram_pernikahan',
        label: 'Mahram Pernikahan',
        reason: getMahramPernikahanReason(relationType),
      }
    }
    if (relationType === 'step_son' || relationType === 'husband_foster_son') {
      return {
        isMahram: true,
        category: 'mahram_pernikahan',
        label: 'Mahram Pernikahan',
        reason: 'Anak tiri laki-laki (atau anak laki-laki susuan suami) - mahram selamanya, cukup dengan akad nikah',
      }
    }
    if (relationType === 'step_father' || relationType === 'foster_mother_husband') {
      return {
        isMahram: true,
        category: 'mahram_pernikahan',
        label: 'Mahram Pernikahan',
        reason: 'Bapak tiri (atau suami ibu susuan) - mahram selamanya, harus sudah dijima\' dengan ibu',
        condition: 'Harus sudah dijima\' dengan ibu',
      }
    }
    if (relationType === 'son_in_law' || relationType === 'foster_daughter_husband') {
      return {
        isMahram: true,
        category: 'mahram_pernikahan',
        label: 'Mahram Pernikahan',
        reason: 'Menantu laki-laki (atau suami anak perempuan susuan) - mahram selamanya, cukup dengan akad nikah',
      }
    }
  }

  // ====== MAHRAM SEMENTARA (temporary - due to marriage) ======
  // For males: wife's relatives (can't marry while married to wife)
  if (userGender === 'male') {
    const sementaraLaranganMale: RelationType[] = [
      'wife_sister', 'wife_paternal_aunt', 'wife_maternal_aunt',
      'wife_niece_from_brother', 'wife_niece_from_sister',
      'wife_foster_sister', 'wife_foster_paternal_aunt', 'wife_foster_maternal_aunt',
      'wife_foster_niece_from_brother', 'wife_foster_niece_from_sister',
    ]
    if (sementaraLaranganMale.includes(relationType)) {
      return {
        isMahram: true,
        category: 'mahram_sementara',
        label: 'Mahram Sementara',
        reason: getMahramSementaraReason(relationType),
        condition: 'Berlaku selama masih menikah dengan istri',
      }
    }

    const sementaraBersuamiMale: RelationType[] = [
      'brother_wife', 'paternal_uncle_wife', 'maternal_uncle_wife', 'nephew_wife',
      'foster_brother_wife', 'foster_paternal_uncle_wife', 'foster_maternal_uncle_wife',
      'foster_nephew_from_brother_wife', 'foster_nephew_from_sister_wife',
    ]
    if (sementaraBersuamiMale.includes(relationType)) {
      return {
        isMahram: true,
        category: 'mahram_sementara',
        label: 'Mahram Sementara',
        reason: getMahramSementaraReason(relationType),
        condition: 'Berlaku selama perempuan tersebut masih bersuami',
      }
    }
  }

  // For females: husband's relatives
  if (userGender === 'female') {
    const sementaraLaranganFemale: RelationType[] = [
      'sister_husband', 'paternal_aunt_husband', 'maternal_aunt_husband', 'niece_husband',
      'foster_sister_husband', 'foster_paternal_aunt_husband', 'foster_maternal_aunt_husband',
      'foster_niece_from_brother_husband', 'foster_niece_from_sister_husband',
    ]
    if (sementaraLaranganFemale.includes(relationType)) {
      return {
        isMahram: true,
        category: 'mahram_sementara',
        label: 'Mahram Sementara',
        reason: getMahramSementaraReason(relationType),
        condition: 'Berlaku selama saudari masih menikah',
      }
    }

    const sementaraBersuamiFemale: RelationType[] = [
      'husband_brother', 'husband_paternal_uncle', 'husband_maternal_uncle',
      'husband_nephew_from_brother', 'husband_nephew_from_sister',
      'husband_foster_brother', 'husband_foster_paternal_uncle', 'husband_foster_maternal_uncle',
      'husband_foster_nephew_from_brother', 'husband_foster_nephew_from_sister',
    ]
    if (sementaraBersuamiFemale.includes(relationType)) {
      return {
        isMahram: true,
        category: 'mahram_sementara',
        label: 'Mahram Sementara',
        reason: getMahramSementaraReason(relationType),
        condition: 'Berlaku selama masih menikah dengan suami',
      }
    }
  }

  // ====== SPOUSE ======
  if (relationType === 'husband' || relationType === 'wife') {
    return {
      isMahram: false,
      category: 'bukan_mahram',
      label: 'Pasangan (Halal)',
      reason: relationType === 'husband' ? 'Suami - pasangan yang halal' : 'Istri - pasangan yang halal',
    }
  }

  // ====== NOT MAHRAM ======
  return {
    isMahram: false,
    category: 'bukan_mahram',
    label: 'Bukan Mahram',
    reason: 'Tidak termasuk dalam kategori mahram',
  }
}

function getMahramNasabReason(type: RelationType): string {
  const reasons: Partial<Record<RelationType, string>> = {
    mother: 'Ibu kandung - mahram nasab selamanya',
    father: 'Bapak kandung - mahram nasab selamanya',
    daughter: 'Anak perempuan kandung - mahram nasab selamanya',
    son: 'Anak laki-laki kandung - mahram nasab selamanya',
    sister: 'Saudara perempuan - mahram nasab selamanya',
    brother: 'Saudara laki-laki - mahram nasab selamanya',
    paternal_aunt: 'Bibi dari bapak - mahram nasab selamanya',
    paternal_uncle: 'Paman dari bapak - mahram nasab selamanya',
    maternal_aunt: 'Bibi dari ibu - mahram nasab selamanya',
    maternal_uncle: 'Paman dari ibu - mahram nasab selamanya',
    niece_from_brother: 'Keponakan perempuan dari saudara laki-laki - mahram nasab selamanya',
    nephew_from_brother: 'Keponakan laki-laki dari saudara laki-laki - mahram nasab selamanya',
    niece_from_sister: 'Keponakan perempuan dari saudara perempuan - mahram nasab selamanya',
    nephew_from_sister: 'Keponakan laki-laki dari saudara perempuan - mahram nasab selamanya',
    paternal_grandmother: 'Nenek dari bapak - mahram nasab selamanya',
    paternal_grandfather: 'Kakek dari bapak - mahram nasab selamanya',
    maternal_grandmother: 'Nenek dari ibu - mahram nasab selamanya',
    maternal_grandfather: 'Kakek dari ibu - mahram nasab selamanya',
  }
  return reasons[type] || 'Mahram karena hubungan nasab (keturunan)'
}

function getMahramSusuanReason(type: RelationType): string {
  const reasons: Partial<Record<RelationType, string>> = {
    foster_mother: 'Ibu susuan - mahram susuan selamanya',
    foster_father: 'Bapak susuan - mahram susuan selamanya',
    foster_daughter: 'Anak perempuan susuan - mahram susuan selamanya',
    foster_son: 'Anak laki-laki susuan - mahram susuan selamanya',
    foster_sister: 'Saudara perempuan susuan - mahram susuan selamanya',
    foster_brother: 'Saudara laki-laki susuan - mahram susuan selamanya',
    foster_paternal_aunt: 'Bibi susuan dari bapak - mahram susuan selamanya',
    foster_paternal_uncle: 'Paman susuan dari bapak - mahram susuan selamanya',
    foster_maternal_aunt: 'Bibi susuan dari ibu - mahram susuan selamanya',
    foster_maternal_uncle: 'Paman susuan dari ibu - mahram susuan selamanya',
    foster_niece_from_brother: 'Keponakan perempuan susuan dari saudara laki-laki - mahram susuan selamanya',
    foster_nephew_from_brother: 'Keponakan laki-laki susuan dari saudara laki-laki - mahram susuan selamanya',
    foster_niece_from_sister: 'Keponakan perempuan susuan dari saudara perempuan - mahram susuan selamanya',
    foster_nephew_from_sister: 'Keponakan laki-laki susuan dari saudara perempuan - mahram susuan selamanya',
    foster_paternal_grandmother: 'Nenek susuan dari bapak - mahram susuan selamanya',
    foster_maternal_grandmother: 'Nenek susuan dari ibu - mahram susuan selamanya',
    foster_paternal_grandfather: 'Kakek susuan dari bapak - mahram susuan selamanya',
    foster_maternal_grandfather: 'Kakek susuan dari ibu - mahram susuan selamanya',
  }
  return reasons[type] || 'Mahram karena hubungan susuan'
}

function getMahramPernikahanReason(type: RelationType): string {
  const reasons: Partial<Record<RelationType, string>> = {
    mother_in_law: 'Ibu mertua - mahram selamanya, cukup dengan akad nikah',
    wife_foster_mother: 'Ibu susuan istri - mahram selamanya, cukup dengan akad nikah',
    wife_paternal_grandmother: 'Nenek istri (dari bapak) - mahram selamanya, cukup dengan akad nikah',
    wife_maternal_grandmother: 'Nenek istri (dari ibu) - mahram selamanya, cukup dengan akad nikah',
    father_in_law: 'Bapak mertua - mahram selamanya, cukup dengan akad nikah',
    husband_foster_father: 'Bapak susuan suami - mahram selamanya, cukup dengan akad nikah',
    husband_paternal_grandfather: 'Kakek suami (dari bapak) - mahram selamanya, cukup dengan akad nikah',
    husband_maternal_grandfather: 'Kakek suami (dari ibu) - mahram selamanya, cukup dengan akad nikah',
  }
  return reasons[type] || 'Mahram karena hubungan pernikahan'
}

function getMahramSementaraReason(type: RelationType): string {
  const reasons: Partial<Record<RelationType, string>> = {
    wife_sister: 'Saudara perempuan istri - haram dimadu (dinikah bersama istri)',
    wife_paternal_aunt: 'Bibi istri dari bapak - haram dimadu',
    wife_maternal_aunt: 'Bibi istri dari ibu - haram dimadu',
    wife_niece_from_brother: 'Keponakan perempuan istri dari saudara laki-laki - haram dimadu',
    wife_niece_from_sister: 'Keponakan perempuan istri dari saudara perempuan - haram dimadu',
    brother_wife: 'Istri saudara laki-laki - haram karena masih bersuami',
    paternal_uncle_wife: 'Istri paman dari bapak - haram karena masih bersuami',
    maternal_uncle_wife: 'Istri paman dari ibu - haram karena masih bersuami',
    nephew_wife: 'Istri keponakan - haram karena masih bersuami',
    sister_husband: 'Suami saudara perempuan - mahram sementara',
    paternal_aunt_husband: 'Suami bibi dari bapak - mahram sementara',
    maternal_aunt_husband: 'Suami bibi dari ibu - mahram sementara',
    niece_husband: 'Suami keponakan - mahram sementara',
    husband_brother: 'Saudara laki-laki suami - mahram sementara selama menikah',
    husband_paternal_uncle: 'Paman suami dari bapak - mahram sementara selama menikah',
    husband_maternal_uncle: 'Paman suami dari ibu - mahram sementara selama menikah',
    husband_nephew_from_brother: 'Keponakan laki-laki suami dari saudara laki-laki - mahram sementara',
    husband_nephew_from_sister: 'Keponakan laki-laki suami dari saudara perempuan - mahram sementara',
    // Musaharah min ar-Rada'ah (Foster Marriage)
    wife_foster_sister: 'Saudara perempuan susuan istri - haram dimadu',
    wife_foster_paternal_aunt: 'Bibi susuan istri dari bapak - haram dimadu',
    wife_foster_maternal_aunt: 'Bibi susuan istri dari ibu - haram dimadu',
    wife_foster_niece_from_brother: 'Keponakan perempuan susuan istri dari saudara laki-laki - haram dimadu',
    wife_foster_niece_from_sister: 'Keponakan perempuan susuan istri dari saudara perempuan - haram dimadu',
    foster_brother_wife: 'Istri saudara laki-laki susuan - haram karena masih bersuami',
    foster_paternal_uncle_wife: 'Istri paman susuan dari bapak - haram karena masih bersuami',
    foster_maternal_uncle_wife: 'Istri paman susuan dari ibu - haram karena masih bersuami',
    foster_nephew_from_brother_wife: 'Istri keponakan laki-laki susuan dari saudara - haram karena bersuami',
    foster_nephew_from_sister_wife: 'Istri keponakan laki-laki susuan dari saudari - haram karena bersuami',
    foster_sister_husband: 'Suami saudara perempuan susuan - mahram sementara',
    foster_paternal_aunt_husband: 'Suami bibi susuan dari bapak - mahram sementara',
    foster_maternal_aunt_husband: 'Suami bibi susuan dari ibu - mahram sementara',
    foster_niece_from_brother_husband: 'Suami keponakan perempuan susuan dari saudara - mahram sementara',
    foster_niece_from_sister_husband: 'Suami keponakan perempuan susuan dari saudari - mahram sementara',
    husband_foster_brother: 'Saudara laki-laki susuan suami - mahram sementara',
    husband_foster_paternal_uncle: 'Paman susuan suami dari bapak - mahram sementara',
    husband_foster_maternal_uncle: 'Paman susuan suami dari ibu - mahram sementara',
    husband_foster_nephew_from_brother: 'Keponakan laki-laki susuan suami - mahram sementara',
    husband_foster_nephew_from_sister: 'Keponakan laki-laki susuan suami - mahram sementara',
  }
  return reasons[type] || 'Mahram sementara karena pernikahan'
}
