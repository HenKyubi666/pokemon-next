export interface Pokemon {
  idPokemon: number;
  namePokemon: string;
}

export interface PokemonDetails {
  imgPokemon?: string;
  namePokemon: string;
  idPokemon: number;
  description: string;
  height: number;
  weight: number;
  category: string;
  gender: string;
  habitat: string;
  color: string;
  types: Array<string>;
  evolution: string;
  // evolution: Array<string>;
}

export interface AppState {
  pokemonList: Array<Pokemon>;
  positionOnArray: number;
  hasNextList: boolean;
  filtred: boolean;
}

export interface ModalState {
  modalOpen: boolean;
  pokemonDataDetails: PokemonDetails;
}

export interface FilterState {
  pokemonsBySearch: Array<Pokemon>;
  pokemonsByColor: Array<Pokemon>;
  pokemonsByType: Array<Pokemon>;
  pokemonsByGender: Array<Pokemon>;
}
