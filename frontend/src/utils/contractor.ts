import { ProjectProperties } from '../types/project';

/**
 * Resolves project to lead contractor or responsible SOE entity for consistent aggregation.
 */
export function resolveContractorEntity(props: ProjectProperties): string {
  const name = props.project_name.toLowerCase();
  const c = (props.contractor || '').toLowerCase();
  const pjpk = (props.pjpk || '').toLowerCase();
  const scheme = (props.funding_scheme || '').toLowerCase();

  if (c.includes('hutama') || name.includes('trans sumatera') || scheme.includes('hutama')) {
    return 'PT Hutama Karya (Persero)';
  }
  if (c.includes('wika') || name.includes('wijaya karya') || name.includes('wika')) {
    return 'PT Wijaya Karya (WIKA)';
  }
  if (c.includes('waskita') || name.includes('waskita')) {
    return 'PT Waskita Karya (Persero)';
  }
  if (c.includes('adhi') || name.includes('lrt jabodebek') || name.includes('adhi karya')) {
    return 'PT Adhi Karya (Persero)';
  }
  if (c.includes('pp') || name.includes('pt pp') || name.includes('pembangunan perumahan')) {
    return 'PT PP (Persero)';
  }
  if (c.includes('jasa marga') || name.includes('jasa marga') || name.includes('trans jawa')) {
    return 'PT Jasa Marga (Persero)';
  }
  if (
    c.includes('pln') ||
    pjpk.includes('esdm') ||
    (props.category === 'Energy' &&
      (name.includes('pltu') ||
        name.includes('pltp') ||
        name.includes('transmisi') ||
        name.includes('gardu') ||
        name.includes('listrik')))
  ) {
    return 'PT PLN (Persero)';
  }
  if (
    c.includes('pertamina') ||
    name.includes('rdmp') ||
    name.includes('kilang') ||
    name.includes('tbbm') ||
    name.includes('gas') ||
    name.includes('masela')
  ) {
    return 'PT Pertamina (Persero)';
  }
  if (c.includes('pelindo') || name.includes('pelabuhan')) {
    return 'PT Pelabuhan Indonesia (Pelindo)';
  }
  if (c.includes('kai') || name.includes('kereta') || name.includes('mrt') || name.includes('lrt')) {
    return 'PT Kereta Api Indonesia (KAI)';
  }
  if (props.category === 'Water') {
    return 'Ditjen SDA & BUMN Karya';
  }
  if (
    scheme.includes('swasta') ||
    scheme.includes('ipp') ||
    name.includes('smelter') ||
    name.includes('industri')
  ) {
    return 'Swasta / Konsorsium Badan Usaha';
  }
  if (props.contractor && props.contractor !== 'BUMN Konstruksi / Swasta') {
    return props.contractor;
  }
  return 'BUMN Karya / Swasta';
}
