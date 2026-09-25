import { ref, onMounted } from 'vue';
import browser from 'webextension-polyfill';

const themes = [
  { name: 'Light', id: 'light' },
  { name: 'Dark', id: 'dark' },
  { name: 'System', id: 'system' },
];
const isPreferDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches;

// 界面强调色（主按钮/侧边栏激活态等 bg-accent 处），默认绿色
const DEFAULT_ACCENT_COLOR = '#16a34a';

function hexToRgbTuple(hex) {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  return `${r} ${g} ${b}`;
}

export function useTheme() {
  const activeTheme = ref('system');

  async function setAccentColor(color) {
    document.documentElement.style.setProperty(
      '--color-accent',
      hexToRgbTuple(color)
    );
    await browser.storage.local.set({ accentColor: color });
  }

  async function getAccentColor() {
    const { accentColor } = await browser.storage.local.get('accentColor');

    return accentColor || DEFAULT_ACCENT_COLOR;
  }

  async function setTheme(theme) {
    const isValidTheme = themes.some(({ id }) => id === theme);

    if (!isValidTheme) return;

    let isDarkTheme = theme === 'dark';

    if (theme === 'system') isDarkTheme = isPreferDark();

    document.documentElement.classList.toggle('dark', isDarkTheme);
    activeTheme.value = theme;

    await browser.storage.local.set({ theme });
  }
  async function getTheme() {
    let { theme } = await browser.storage.local.get('theme');

    if (!theme) theme = 'system';

    return theme;
  }
  async function init() {
    const theme = await getTheme();

    await setTheme(theme);
    await setAccentColor(await getAccentColor());
  }

  onMounted(async () => {
    activeTheme.value = await getTheme();
  });

  return {
    init,
    themes,
    activeTheme,
    set: setTheme,
    get: getTheme,
    setAccentColor,
    getAccentColor,
  };
}
