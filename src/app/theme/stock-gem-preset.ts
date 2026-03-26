import { definePreset } from '@primeng/themes';
import Lara from '@primeng/themes/lara';

/** Escala primària derivada de #494849 per PrimeNG semantic tokens */
const primaryScale = {
  50: '#f5f4f4',
  100: '#e8e7e7',
  200: '#d1d0d0',
  300: '#a8a6a7',
  400: '#7a7879',
  500: '#494849',
  600: '#3d3c3d',
  700: '#333233',
  800: '#2b2a2b',
  900: '#252425',
  950: '#181718',
};

export const StockGemPreset = definePreset(Lara, {
  semantic: {
    primary: primaryScale,
  },
});
