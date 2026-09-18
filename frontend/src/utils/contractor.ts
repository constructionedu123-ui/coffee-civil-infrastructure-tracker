import { ProjectProperties } from '../types/project';
import { getPrimaryContractor } from './contractorMatcher';

export {
  MAJOR_CONTRACTORS,
  type StandardizedContractor,
  normalizeContractorText,
  getProjectContractors,
  getPrimaryContractor,
  projectMatchesContractor,
  getContractorStats,
} from './contractorMatcher';

/**
 * Resolves project to lead contractor or responsible SOE entity for consistent aggregation.
 */
export function resolveContractorEntity(props: ProjectProperties): string {
  return getPrimaryContractor(props);
}
