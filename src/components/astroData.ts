import type { AstroShot, ObjectFilterOption } from './types'

export const DEEP_SKY_ID = 10
export const EARTH_ID = 3
export const MOON_ID = 9
export const EARTH_SYSTEM_IDS = [EARTH_ID, MOON_ID] as const

export const OBJECT_NAMES: Record<number, string> = {
  [DEEP_SKY_ID]: 'Deep Sky',
  0: 'Солнце',
  1: 'Меркурий',
  2: 'Венера',
  3: 'Земля',
  4: 'Марс',
  5: 'Юпитер',
  6: 'Сатурн',
  7: 'Уран',
  8: 'Нептун',
  9: 'Луна',
}

export const FILTER_OPTIONS: ObjectFilterOption[] = [
  { type: 'single', id: DEEP_SKY_ID, label: 'Deep Sky' },
  { type: 'single', id: 0, label: 'Солнце' },
  { type: 'single', id: 1, label: 'Меркурий' },
  { type: 'single', id: 2, label: 'Венера' },
  {
    type: 'group',
    id: 'earth-system',
    label: 'Система Земли',
    children: [
      { id: EARTH_ID, label: 'Земля' },
      { id: MOON_ID, label: 'Луна' },
    ],
  },
  { type: 'single', id: 4, label: 'Марс' },
  { type: 'single', id: 5, label: 'Юпитер' },
  { type: 'single', id: 6, label: 'Сатурн' },
  { type: 'single', id: 7, label: 'Уран' },
  { type: 'single', id: 8, label: 'Нептун' },
]

export const ASTRO_SHOTS: AstroShot[] = [
  {
    id: 1,
    title: 'Активные солнечные пятна',
    author: 'Алина К.',
    objectId: 0,
    image: '/textures/2k_sun.jpg',
    likes: 214,
    telescope: 'Sky-Watcher 200PDS',
    camera: 'ZWO ASI585MC',
    coordinates: 'RA 02h 31m, Dec +12d 24m',
    location: 'Сочи, Россия',
    description: 'Стекинг 1200 кадров через солнечный фильтр, усилен локальный контраст.',
  },
  {
    id: 2,
    title: 'Фаза Венеры на закате',
    author: 'Никита Р.',
    objectId: 2,
    image: '/textures/2k_venus_atmosphere.jpg',
    likes: 167,
    telescope: 'Celestron C8',
    camera: 'Canon EOS 90D',
    coordinates: 'RA 04h 18m, Dec +21d 05m',
    location: 'Казань, Россия',
    description: 'Снимок сделан в просвет облачности, серия из 70 кадров.',
  },
  {
    id: 3,
    title: 'Марс в противостоянии',
    author: 'Влад С.',
    objectId: 4,
    image: '/textures/2k_mars.jpg',
    likes: 302,
    telescope: 'Meade LX90 8"',
    camera: 'ASI462MC',
    coordinates: 'RA 07h 41m, Dec +24d 19m',
    location: 'Новосибирск, Россия',
    description: 'Собраны серии по RGB-каналам, итоговый кадр с мягкой шарпинговой обработкой.',
  },
  {
    id: 4,
    title: 'Полосы Юпитера крупным планом',
    author: 'Игорь Л.',
    objectId: 5,
    image: '/textures/2k_jupiter.jpg',
    likes: 426,
    telescope: 'Dobsonian 300/1500',
    camera: 'Player One Neptune-C II',
    coordinates: 'RA 11h 03m, Dec -03d 52m',
    location: 'Алматы, Казахстан',
    description: 'Видны детали Большого Красного Пятна и турбулентность в экваториальных поясах.',
  },
  {
    id: 5,
    title: 'Кольца Сатурна',
    author: 'Елена Т.',
    objectId: 6,
    image: '/textures/2k_saturn.jpg',
    likes: 358,
    telescope: 'Sky-Watcher 250P',
    camera: 'Nikon Z6 II',
    coordinates: 'RA 14h 22m, Dec -09d 11m',
    location: 'Баку, Азербайджан',
    description: 'Кадр получен при хорошем сиинге, отчетливо видна щель Кассини.',
  },
  {
    id: 6,
    title: 'Голубой диск Нептуна',
    author: 'Саша М.',
    objectId: 8,
    image: '/textures/2k_neptune.jpg',
    likes: 141,
    telescope: 'Maksutov 180',
    camera: 'ASI678MC',
    coordinates: 'RA 22h 47m, Dec -10d 02m',
    location: 'Тбилиси, Грузия',
    description: 'Слабоконтрастная обработка, чтобы сохранить естественный оттенок планеты.',
  },
  {
    id: 7,
    title: 'Уран в холодных тонах',
    author: 'Денис П.',
    objectId: 7,
    image: '/textures/2k_uranus.jpg',
    likes: 120,
    telescope: 'Celestron EdgeHD 9.25',
    camera: 'QHY5III715C',
    coordinates: 'RA 03h 09m, Dec +17d 43m',
    location: 'Ереван, Армения',
    description: 'Финальный кадр собран из 12 видеофрагментов по 90 секунд.',
  },
  {
    id: 8,
    title: 'Текстуры Меркурия',
    author: 'Марина Ф.',
    objectId: 1,
    image: '/textures/2k_mercury.jpg',
    likes: 95,
    telescope: 'Explore Scientific 127ED',
    camera: 'Sony A7 III',
    coordinates: 'RA 00h 41m, Dec -05d 33m',
    location: 'Калининград, Россия',
    description: 'Показаны тонкие переходы рельефа после аккуратной деконволюции.',
  },
  {
    id: 9,
    title: 'Облачные фронты Земли',
    author: 'Олег Н.',
    objectId: EARTH_ID,
    image: '/textures/2k_earth_daymap.jpg',
    likes: 289,
    telescope: 'Samyang 135mm',
    camera: 'Canon EOS R6',
    coordinates: 'RA 18h 11m, Dec +06d 04m',
    location: 'Владивосток, Россия',
    description: 'Серия кадров через узкую облачную щель, объединено в единый кадр.',
  },
  {
    id: 10,
    title: 'Глубокое небо Млечного Пути',
    author: 'Анна В.',
    objectId: DEEP_SKY_ID,
    image: '/textures/8k_stars_milky_way.jpg',
    likes: 511,
    telescope: 'RedCat 51',
    camera: 'ASI2600MC Pro',
    coordinates: 'RA 17h 45m, Dec -29d 00m',
    location: 'Чолпон-Ата, Кыргызстан',
    description: 'Общая экспозиция 4 часа, калибровка по dark/bias/flat и мягкое шумоподавление.',
  },
  {
    id: 11,
    title: 'Лунные кратеры на терминаторе',
    author: 'Роман Г.',
    objectId: MOON_ID,
    image: '/textures/2k_moon.jpg',
    likes: 274,
    telescope: 'Orion XT8',
    camera: 'ASI224MC',
    coordinates: 'RA 08h 52m, Dec +19d 14m',
    location: 'Минск, Беларусь',
    description: 'Подчеркнуты тени по линии терминатора для лучшей читаемости рельефа.',
  },
]

export function getObjectName(objectId: number): string {
  return OBJECT_NAMES[objectId] ?? 'Неизвестный объект'
}

export function matchesShotSearch(shot: AstroShot, normalizedSearch: string): boolean {
  if (!normalizedSearch) {
    return true
  }

  const searchable = [
    shot.title,
    shot.author,
    getObjectName(shot.objectId),
    shot.telescope,
    shot.camera,
    shot.coordinates,
    shot.location,
    shot.description,
  ].join(' ').toLowerCase()

  return searchable.includes(normalizedSearch)
}
