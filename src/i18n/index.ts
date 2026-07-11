/**
 * Localized strings. Add languages by extending the StringMap type.
 * Components access strings via the useT() hook below.
 */

import { useAppStore } from '../store/appStore';

type StringKey =
  | 'app_name' | 'tagline'
  | 'feat_scan' | 'feat_body' | 'feat_clothes'
  | 'start_camera' | 'upload_instead'
  | 'step1_title' | 'step1_help'
  | 'step2_title' | 'step2_confirm'
  | 'step3_shirt' | 'step3_pants' | 'step3_dress' | 'step3_full'
  | 'hint_shirt' | 'hint_pants' | 'hint_dress' | 'hint_full'
  | 'mode_shirt' | 'mode_pants' | 'mode_dress' | 'mode_full'
  | 'sub_tshirt' | 'sub_long_sleeve' | 'sub_tank' | 'sub_vneck'
  | 'sub_pants_long' | 'sub_pants_shorts' | 'sub_pants_skirt'
  | 'sub_dress_knee' | 'sub_dress_long' | 'sub_dress_mini'
  | 'sub_full_casual' | 'sub_full_summer' | 'sub_full_formal'
  | 'btn_back' | 'btn_close' | 'btn_pause' | 'btn_resume' | 'btn_flip'
  | 'btn_capture' | 'btn_save' | 'btn_share' | 'btn_take_another'
  | 'permission_camera' | 'permission_camera_denied'
  | 'pose_detected' | 'pose_not_detected'
  | 'saved_to_library'
  | 'settings_title'
  | 'settings_outline_thickness' | 'settings_outline_color' | 'settings_glow' | 'settings_fill'
  | 'settings_thin' | 'settings_medium' | 'settings_thick'
  | 'settings_language' | 'settings_haptics'
  | 'settings_reset_calibration' | 'settings_delete_photos' | 'settings_about'
  | 'reset_done' | 'photos_deleted';

const en: Record<StringKey, string> = {
  app_name: 'Transparent Fit',
  tagline: 'See any clothes on you using just the camera',
  feat_scan: 'Scan any clothes in real life',
  feat_body: 'Your body stays the same',
  feat_clothes: 'Real clothes appear on you',
  start_camera: 'Start →',
  upload_instead: 'Upload a photo instead',
  step1_title: 'STEP 1 · Take a full body photo',
  step1_help: 'Stand 2 m back, full body in frame, arms slightly away from body',
  step2_title: 'STEP 2 · Confirm body points',
  step2_confirm: 'Start Try-On →',
  step3_shirt: 'SHIRT MODE',
  step3_pants: 'PANTS MODE',
  step3_dress: 'DRESS MODE',
  step3_full:  'FULL OUTFIT MODE',
  hint_shirt:  'Point at a shirt',
  hint_pants:  'Point at pants',
  hint_dress:  'Point at a dress',
  hint_full:   'Point at an outfit',
  mode_shirt:  'Shirt',
  mode_pants:  'Pants',
  mode_dress:  'Dress',
  mode_full:   'Full',
  sub_tshirt:        'T-shirt',
  sub_long_sleeve:   'Long sleeve',
  sub_tank:          'Tank',
  sub_vneck:         'V-neck',
  sub_pants_long:    'Long',
  sub_pants_shorts:  'Shorts',
  sub_pants_skirt:   'Skirt',
  sub_dress_knee:    'Knee',
  sub_dress_long:    'Long',
  sub_dress_mini:    'Mini',
  sub_full_casual:   'Casual',
  sub_full_summer:   'Summer',
  sub_full_formal:   'Formal',
  btn_back: 'Back',
  btn_close: 'Close',
  btn_pause: 'Pause',
  btn_resume: 'Resume',
  btn_flip: 'Flip',
  btn_capture: 'Capture',
  btn_save: 'Save',
  btn_share: 'Share',
  btn_take_another: 'Take another',
  permission_camera: 'We need your camera to show clothes on you in real time.',
  permission_camera_denied: 'Camera unavailable. You can upload a photo instead.',
  pose_detected: 'Body detected — confirm or adjust the points',
  pose_not_detected: 'No body detected — please place the points manually',
  saved_to_library: 'Photo saved to your library.',
  settings_title: 'Settings',
  settings_outline_thickness: 'Outline thickness',
  settings_outline_color: 'Outline color',
  settings_glow: 'Outline glow',
  settings_fill: 'Transparent pattern fill',
  settings_thin: 'Thin',
  settings_medium: 'Medium',
  settings_thick: 'Thick',
  settings_language: 'Language',
  settings_haptics: 'Haptic feedback',
  settings_reset_calibration: 'Reset calibration',
  settings_delete_photos: 'Delete all stored photos',
  settings_about: 'About',
  reset_done: 'Calibration cleared.',
  photos_deleted: 'Stored photos deleted.',
};

const he: Record<StringKey, string> = {
  app_name: 'Transparent Fit',
  tagline: 'ראה כל בגד עליך עם המצלמה בלבד',
  feat_scan: 'סרוק בגדים אמיתיים מהמציאות',
  feat_body: 'הגוף שלך נשאר אותו דבר',
  feat_clothes: 'בגדים אמיתיים נופלים עליך',
  start_camera: 'תתחיל ←',
  upload_instead: 'העלה תמונה במקום →',
  step1_title: 'שלב 1 · צלם תמונת גוף מלא',
  step1_help: 'עמוד במרחק 2 מ׳, גוף מלא בפריים, ידיים מרוחקות מעט מהגוף',
  step2_title: 'שלב 2 · אשר את נקודות הגוף',
  step2_confirm: 'התחל מדידה ←',
  step3_shirt: 'מצב חולצה',
  step3_pants: 'מצב מכנסיים',
  step3_dress: 'מצב שמלה',
  step3_full:  'מצב חליפה',
  hint_shirt:  'כוון לחולצה',
  hint_pants:  'כוון למכנסיים',
  hint_dress:  'כוון לשמלה',
  hint_full:   'כוון לחליפה',
  mode_shirt:  'חולצה',
  mode_pants:  'מכנסיים',
  mode_dress:  'שמלה',
  mode_full:   'חליפה',
  sub_tshirt:        'טי-שירט',
  sub_long_sleeve:   'שרוול ארוך',
  sub_tank:          'גופייה',
  sub_vneck:         'V-נק',
  sub_pants_long:    'ארוך',
  sub_pants_shorts:  'קצרים',
  sub_pants_skirt:   'חצאית',
  sub_dress_knee:    'ברך',
  sub_dress_long:    'ארוכה',
  sub_dress_mini:    'מיני',
  sub_full_casual:   'קז׳ואל',
  sub_full_summer:   'קיצי',
  sub_full_formal:   'רשמי',
  btn_back: 'חזרה',
  btn_close: 'סגור',
  btn_pause: 'השהה',
  btn_resume: 'המשך',
  btn_flip: 'הפוך',
  btn_capture: 'צלם',
  btn_save: 'שמור',
  btn_share: 'שתף',
  btn_take_another: 'צלם שוב',
  permission_camera: 'נדרשת גישה למצלמה כדי להציג בגדים עליך בזמן אמת.',
  permission_camera_denied: 'המצלמה לא זמינה. אפשר להעלות תמונה במקום.',
  pose_detected: 'הגוף זוהה — אשר או כוונן את הנקודות',
  pose_not_detected: 'לא זוהה גוף — מקם את הנקודות ידנית',
  saved_to_library: 'התמונה נשמרה בגלריה.',
  settings_title: 'הגדרות',
  settings_outline_thickness: 'עובי קו המתאר',
  settings_outline_color: 'צבע קו המתאר',
  settings_glow: 'הילה סביב הקו',
  settings_fill: 'מילוי דוגמת שקיפות',
  settings_thin: 'דק',
  settings_medium: 'בינוני',
  settings_thick: 'עבה',
  settings_language: 'שפה',
  settings_haptics: 'משוב מישושי',
  settings_reset_calibration: 'איפוס כיול',
  settings_delete_photos: 'מחק את כל התמונות השמורות',
  settings_about: 'אודות',
  reset_done: 'הכיול נמחק.',
  photos_deleted: 'התמונות השמורות נמחקו.',
};

const dictionaries = { en, he };

export function useT() {
  const lang = useAppStore(s => s.language);
  return (key: StringKey): string => dictionaries[lang][key] ?? key;
}
