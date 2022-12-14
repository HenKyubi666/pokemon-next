import { createContext } from "react";
import { AppState, Pokemon } from "../../interfaces/interfaces";

type AppContextProps = {
  appState: AppState;
  setPokemonList: (pokemonList: Array<Pokemon>) => void;
  setPositionOnArray: () => void;
  setHasNextList: () => void;
  setfiltred: (isFiltred: boolean) => void;
};

export const AppContext = createContext<AppContextProps>({} as AppContextProps);
