'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createDemoState } from '@/data/mock/seed';
import { stateSchema } from '@/data/contracts/storage';
import { applyAction, type Action } from '@/features/leads/mutations';
import type { CRMState, User } from '@/types/crm';

const KEY = 'flete-crm-demo-v1';
interface Context {
  state: CRMState;
  user: User;
  ready: boolean;
  now: number;
  storageWarning: string;
  dispatch: (action: Action) => void;
  switchUser: (id: string) => void;
  reset: () => void;
}
const CRMContext = createContext<Context | null>(null);
export function CRMProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CRMState>(() => createDemoState());
  const ref = useRef(state);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [storageWarning, setWarning] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(KEY);
        if (stored) {
          const parsed = stateSchema.safeParse(JSON.parse(stored));
          if (parsed.success) {
            ref.current = parsed.data;
            setState(parsed.data);
          } else
            setWarning(
              'Los datos guardados no son compatibles. Se cargaron ejemplos iniciales; puedes restaurar la demostración.',
            );
        } else localStorage.setItem(KEY, JSON.stringify(ref.current));
      } catch {
        setWarning(
          'No fue posible leer el almacenamiento local. Puedes usar la demo, pero los cambios podrían no conservarse.',
        );
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const commit = useCallback((next: CRMState) => {
    ref.current = next;
    setState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setWarning('');
    } catch {
      setWarning(
        'No se pudieron guardar los cambios en este navegador. Permanecerán solo durante esta sesión.',
      );
    }
  }, []);
  const dispatch = useCallback(
    (action: Action) => {
      const current = ref.current;
      const user = current.users.find((u) => u.id === current.currentUserId)!;
      commit(applyAction(current, user, action));
    },
    [commit],
  );
  const switchUser = useCallback(
    (id: string) => {
      if (ref.current.users.some((u) => u.id === id && u.active))
        commit({ ...ref.current, currentUserId: id });
    },
    [commit],
  );
  const reset = useCallback(() => commit(createDemoState()), [commit]);
  return (
    <CRMContext.Provider
      value={{
        state,
        user: state.users.find((u) => u.id === state.currentUserId)!,
        ready,
        now,
        storageWarning,
        dispatch,
        switchUser,
        reset,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}
export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) throw new Error('Falta CRMProvider');
  return context;
}
