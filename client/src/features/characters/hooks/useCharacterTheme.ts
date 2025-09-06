import { useMemo } from "react";
import type { CharacterTheme, CharacterType } from "../types/characterTypes";
import { getCharacterTheme, getDefaultTheme } from "../utils/characterThemes";

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
