export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY')

export type DashboardRange = '7d' | '30d' | '12m'

export interface DashboardRepository {
  read(range: DashboardRange): Promise<Record<string, unknown>>
}
