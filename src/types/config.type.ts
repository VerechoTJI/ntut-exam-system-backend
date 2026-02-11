import { Puzzle as ConfigPuzzle } from "../schemas/config.schemas";

export interface Puzzle extends ConfigPuzzle {
  compareMode?: "strict" | "loose";
}