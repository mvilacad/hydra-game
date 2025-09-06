import { useMemo } from "react";
import { getCharacterTheme, getDefaultTheme } from "../utils/characterThemes";
import type { CharacterType, CharacterTheme } from "../types/characterTypes";

export const useCharacterTheme = (
	characterType?: CharacterType,
): CharacterTheme => {
	return useMemo(() => {
		if (!characterType) {
			return getDefaultTheme();
		}

		return getCharacterTheme(characterType);
	}, [characterType]);
};
