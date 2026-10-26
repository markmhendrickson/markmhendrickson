import { createContext, useContext, useEffect, type DependencyList, type ReactNode } from 'react'

/**
 * Lets a page put controls in the top-right of the app header (next to the breadcrumb).
 * The Layout owns the slot; a page registers its actions while it is mounted.
 */
type SetHeaderActions = (actions: ReactNode) => void

const HeaderActionsContext = createContext<SetHeaderActions>(() => {})

export const HeaderActionsProvider = HeaderActionsContext.Provider

export function useHeaderActions(render: () => ReactNode, deps: DependencyList): void {
  const setHeaderActions = useContext(HeaderActionsContext)
  useEffect(() => {
    setHeaderActions(render())
    return () => setHeaderActions(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeaderActions, ...deps])
}
