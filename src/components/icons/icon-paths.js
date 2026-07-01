// Lightweight inline icon set (stroke-based, Lucide-inspired proportions) so the
// app never relies on emoji for structural UI. Every icon shares a 24x24 grid,
// currentColor stroke and 1.75 stroke-width for visual consistency.
export const ICONS = {
  box: '<path d="M3 8.2 12 3l9 5.2-9 5.2-9-5.2Z"/><path d="M3 8.2V16l9 5 9-5V8.2"/><path d="M12 13.4V21"/>',
  fish: '<path d="M3 12c2.8-4.2 7-6.4 11-6.4 2.6 0 4.6 1.7 5.6 3.1a1 1 0 0 1 0 1.1c-1 1.7-3 3.6-5.6 3.6-4 0-8.2-2.1-11-6.4Z"/><path d="M19.6 8.7 21 6v12l-1.4-2.7"/><circle cx="8.3" cy="10.6" r="0.9" fill="currentColor" stroke="none"/>',
  factory: '<path d="M3 21V11l6 3.4V11l6 3.4V11l6 3.4V21H3Z"/><rect x="7" y="17" width="2.4" height="4" fill="currentColor" stroke="none"/><rect x="14" y="14" width="2.4" height="2.4" fill="currentColor" stroke="none"/>',
  download: '<path d="M12 3.5v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 19.5h15"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.1 7.3"/><path d="M20 5v6h-6"/>',
  pencil: '<path d="M14.3 4.6 19.4 9.7 8.2 20.9 3.6 21.4l0.6-4.7L14.3 4.6Z"/>',
  trash: '<path d="M4.5 7h15"/><path d="M6.5 7V4.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1V7"/><path d="M6.5 7l1 12.5a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9L17.5 7"/><line x1="10.3" y1="11" x2="10.3" y2="16.3"/><line x1="13.7" y1="11" x2="13.7" y2="16.3"/>',
  shuffle: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 12V10a4 4 0 0 1 4-4h13"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 12v2a4 4 0 0 1-4 4h-13"/>',
  history: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 1.9"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  'check-circle': '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.3l2.6 2.6 5.4-5.8"/>',
  'alert-circle': '<circle cx="12" cy="12" r="8.5"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none"/><path d="M10.6 11.2h1.2v5.4h1.2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.2"/><line x1="15.2" y1="15.2" x2="20" y2="20"/>',
  menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
  filter: '<path d="M4 5.5h16"/><path d="M7.5 12h9"/><path d="M10.5 18.5h3"/>',
}
