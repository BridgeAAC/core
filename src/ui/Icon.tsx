const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h4.5v-6h4v6h4.5V9.5',
  back: 'M10 6 4 12l6 6M4 12h16',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM20 20l-4.8-4.8',
  books: 'M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5ZM13 4h5.5c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5H13Z',
  keyboard:
    'M3.5 6.5h17v11h-17ZM7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 13.5h.01M17 13.5h.01M9.5 13.5h5',
  chat: 'M4 5h16v11H9l-5 4Z M8 9.5h8M8 12.5h5',
  pencil: 'M4 20h4L19 9l-4-4L4 16ZM13.5 6.5l4 4',
  check: 'M4.5 12.5 9.5 17.5 19.5 7',
  download: 'M12 4v11M7 10.5 12 15.5 17 10.5M5 19.5h14',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5l1.6 1.2-2 3.5-1.9-.7a7.4 7.4 0 0 1-2 1.2l-.3 2h-4l-.3-2a7.4 7.4 0 0 1-2-1.2l-1.9.7-2-3.5 1.6-1.2a7.6 7.6 0 0 1 0-3L3 9.3l2-3.5 1.9.7a7.4 7.4 0 0 1 2-1.2l.3-2h4l.3 2a7.4 7.4 0 0 1 2 1.2l1.9-.7 2 3.5-1.6 1.2a7.6 7.6 0 0 1 0 3Z',
  speak: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4ZM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  stop: 'M7 7h10v10H7Z',
  backspace: 'M9 5.5h11v13H9l-5.5-6.5ZM12 9.5l5 5M17 9.5l-5 5',
  delWord: 'M3.5 12h5M11 7v10M14 7v10M17 7v10M20.5 7v10',
  clear: 'M6 6l12 12M18 6 6 18',
  star: 'm12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 19l1-5.4-4-3.8 5.4-.7Z',
  undo: 'M8.5 6 4 10.5 8.5 15M4 10.5h10a5 5 0 0 1 0 10h-3',
  redo: 'M15.5 6 20 10.5 15.5 15M20 10.5H10a5 5 0 0 0 0 10h3',
  grid: 'M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z',
  pages: 'M7 3.5h8l4 4V20H7ZM15 3.5v4h4M4 7v14h11',
  heart:
    'M12 20.5s-7.5-4.6-7.5-10.3a4.4 4.4 0 0 1 7.5-3.1 4.4 4.4 0 0 1 7.5 3.1c0 5.7-7.5 10.3-7.5 10.3Z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      class="ui-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
