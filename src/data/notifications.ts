import { AppNotification } from '@/types';

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: '1',
    type: 'planner',
    titleHe: 'נשארו ימים ללא ארוחות',
    titleEn: 'Days without meals',
    descriptionHe: 'יש לכם עוד 3 ימים בשבוע שלא כוסו. הוסיפו ארוחות לפלאנר.',
    descriptionEn: 'You have 3 more days this week without meals. Add them to your planner.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    read: false,
    actionLabelHe: 'פתיחת הפלאנר',
    actionLabelEn: 'Open Planner',
    actionUrl: '/planner',
  },
  {
    id: '2',
    type: 'shopping-list',
    titleHe: 'רשימת הקניות מוכנה',
    titleEn: 'Shopping list ready',
    descriptionHe: 'רשימת הקניות לשבוע הוכנה ומחכה לכם.',
    descriptionEn: 'Your weekly shopping list is ready and waiting.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hr ago
    read: false,
    actionLabelHe: 'צפייה ברשימה',
    actionLabelEn: 'View list',
    actionUrl: '/checklist',
  },
  {
    id: '3',
    type: 'recommendation',
    titleHe: 'מתכון שיכול להתאים לכם',
    titleEn: 'A recipe you might like',
    descriptionHe: 'עוף בטריאקי — מתכון מהיר שמתאים להעדפות שלכם.',
    descriptionEn: 'Teriyaki Chicken — a quick recipe that matches your preferences.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hr ago
    read: true,
    actionLabelHe: 'צפייה במתכון',
    actionLabelEn: 'View recipe',
    actionUrl: '/recipes/teriyaki-chicken',
  },
  {
    id: '4',
    type: 'prep-guide',
    titleHe: 'מדריך ההכנה מוכן',
    titleEn: 'Prep guide ready',
    descriptionHe: 'סידרנו את המתכונים שלכם לתהליך הכנה אחד מסודר.',
    descriptionEn: 'We organized your recipes into one efficient prep process.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    actionLabelHe: 'התחלת ההכנה',
    actionLabelEn: 'Start cooking',
    actionUrl: '/checklist',
  },
  {
    id: '5',
    type: 'reminder',
    titleHe: 'עבר שבוע מאז התכנון האחרון',
    titleEn: 'A week since your last plan',
    descriptionHe: 'הגיע הזמן לתכנן את השבוע החדש.',
    descriptionEn: 'Time to plan the new week.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
    actionLabelHe: 'בניית שבוע חדש',
    actionLabelEn: 'Build new week',
    actionUrl: '/planner',
  },
];
